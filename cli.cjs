'use strict';

const process = require('node:process');

if (process.argv.slice(2).includes('-?')) {
  // eslint-disable-next-line no-console
  console.log(`Usage: texample [files] [blockIdx] [-r <file>]... [-c <config>] [-i] [-?]

  files       comma-separated list of markdown files (default ./README.md).
              An entry with *, ? or [ is a glob pattern, expanded with node's
              own fs.glob (node 22+) so it works in npm scripts on Windows too. ** matches
              subdirectories, node_modules is never entered, matches run in
              sorted order and a pattern that matches nothing is skipped with a
              warning. A file runs once, however many entries name or match it.
              Symlinks are silently ignored, list the target instead.
  blockIdx    0-based index of a single \`\`\`javascript block to run
  -r <path>   ESM file evaluated in the example's vm context before the example
              runs. May be repeated to chain multiple setup files. Paths are
              resolved relative to cwd. Use this to mutate the sandbox itself
              (e.g. override globalThis.fetch).
  -c <path>   JSON config file with { "require": [...], "node-option": [...] }
              \`require\` paths are resolved relative to the config file and run
              as -r setup files in the vm context; \`node-option\` entries are
              appended to the always-on defaults (--experimental-vm-modules
              --no-warnings) and forwarded as --<option> in execArgv. Use this
              for process-level setup that has to be in place before texample
              itself can run (e.g. extra Node flags, host-process polyfills).
  -i          exit 0 even when an example throws — errors are still printed to
              stderr, but the process status is silenced.
  -?          show this help

The vm context defaults to globalThis — examples have access to fetch,
EventTarget, performance, and the rest of Node's runtime. Each invocation runs
in its own forked child process, so mutations don't leak across runs.

Examples:
  texample ./README.md
  texample ./README.md,./docs/API.md
  texample './docs/**/*.md'
  texample ./README.md 2
  texample ./example.md -r ./deny-fetch.mjs -r ./mock-time.mjs
  texample ./example.md -c ./texample-config.json`);
  return;
}

const vm = require('node:vm');
const { glob, realpath } = require('node:fs/promises');
const { basename, join, relative, resolve: resolvePath } = require('node:path');

const { ExampleEvaluator } = require('./dist/index.cjs');

if (!('SourceTextModule' in vm)) throw new Error('No SourceTextModule in vm, try using node --experimental-vm-modules flag');

const CWD = process.cwd();

const packageDefinition = require(resolvePath(CWD, 'package.json'));

let blockIdx = NaN;
let markdownFiles = './README.md';
let ignoreExit = false;
const setupFiles = [];

const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '-g') continue;
  else if (arg === '-i') ignoreExit = true;
  else if (arg === '-r') setupFiles.push(argv[++i]);
  else if (!isNaN(Number(arg))) blockIdx = Number(arg);
  else markdownFiles = arg;
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  if (!ignoreExit) process.exitCode = 1;
});

async function run() {
  const seen = new Set();
  const realCwd = await realpath(CWD);
  for (const arg of markdownFiles.split(',').filter(Boolean)) {
    const matches = await expand(arg);
    // eslint-disable-next-line no-console
    if (!matches.length) console.error(`${arg}: no matching file, skipped.`);
    for (const filePath of matches) {
      const resolved = resolvePath(CWD, filePath);
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      if (await throughSymlink(realCwd, resolved)) continue;
      await new ExampleEvaluator(filePath, packageDefinition, CWD, undefined, setupFiles).evaluate(blockIdx);
    }
  }
}

/**
 * Symlinks are never evaluated, list the target instead. The real path is compared
 * with the path as given, so a link anywhere below cwd is caught, the file itself or
 * a directory on the way to it. A missing file is not a link, the evaluator reports
 * the ENOENT as before
 * @param {string} realCwd real path of the current directory
 * @param {string} resolved absolute path as given
 * @returns {Promise<boolean>}
 */
async function throughSymlink(realCwd, resolved) {
  try {
    return (await realpath(resolved)) !== join(realCwd, relative(CWD, resolved));
  } catch {
    return false;
  }
}

/**
 * Expand a glob pattern to the sorted matching files, a plain path is returned as is.
 * fs.glob arrived in node 22, on older versions the argument is taken as a plain path
 * @param {string} arg
 * @returns {Promise<string[]>}
 */
async function expand(arg) {
  if (!glob || !/[*?[]/.test(arg)) return [arg];
  const matches = [];
  for await (const file of glob(arg, { exclude: (path) => basename(path) === 'node_modules' })) matches.push(file);
  return matches.sort();
}
