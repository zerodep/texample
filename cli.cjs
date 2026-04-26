'use strict';

const process = require('node:process');

if (process.argv.slice(2).includes('-?')) {
  // eslint-disable-next-line no-console
  console.log(`Usage: texample [files] [blockIdx] [-r <file>]... [-c <config>] [-?]

  files       comma-separated list of markdown files (default ./README.md)
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
  -?          show this help

The vm context defaults to globalThis — examples have access to fetch,
EventTarget, performance, and the rest of Node's runtime. Each invocation runs
in its own forked child process, so mutations don't leak across runs.

Examples:
  texample ./README.md
  texample ./README.md,./docs/API.md
  texample ./README.md 2
  texample ./example.md -r ./deny-fetch.mjs -r ./mock-time.mjs
  texample ./example.md -c ./texample-config.json`);
  return;
}

const vm = require('node:vm');
const { resolve: resolvePath } = require('node:path');

const { ExampleEvaluator } = require('./dist/index.cjs');

if (!('SourceTextModule' in vm)) throw new Error('No SourceTextModule in vm, try using node --experimental-vm-modules flag');

const CWD = process.cwd();

const packageDefinition = require(resolvePath(CWD, 'package.json'));

let blockIdx = NaN;
let markdownFiles = './README.md';
const setupFiles = [];

const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '-g') continue;
  else if (arg === '-r') setupFiles.push(argv[++i]);
  else if (!isNaN(Number(arg))) blockIdx = Number(arg);
  else markdownFiles = arg;
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  process.exitCode = 1;
});

async function run() {
  for (const filePath of markdownFiles.split(',')) {
    await new ExampleEvaluator(filePath, packageDefinition, CWD, undefined, setupFiles).evaluate(blockIdx);
  }
}
