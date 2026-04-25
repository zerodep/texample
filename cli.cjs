'use strict';

const process = require('node:process');

if (process.argv.slice(2).includes('-?')) {
  // eslint-disable-next-line no-console
  console.log(`Usage: texample [files] [blockIdx] [-g] [-?]

  files     comma-separated list of markdown files (default ./README.md)
  blockIdx  0-based index of a single \`\`\`javascript block to run
  -g        use globalThis as the vm context (for modules with global side-effects)
  -?        show this help

Examples:
  texample ./README.md
  texample ./README.md,./docs/API.md
  texample ./README.md 2
  texample ./test/docs/globals.md -g`);
  return;
}

const vm = require('node:vm');
const { resolve: resolvePath } = require('node:path');

const { ExampleEvaluator } = require('./dist/index.cjs');

if (!('SourceTextModule' in vm)) throw new Error('No SourceTextModule in vm, try using node --experimental-vm-modules flag');

const CWD = process.cwd();

const packageDefinition = require(resolvePath(CWD, 'package.json'));

let globalContext = false;
let blockIdx = NaN;
let markdownFiles = './README.md';

for (const arg of process.argv.slice(2, 4)) {
  if (arg === undefined) break;
  else if (arg === '-g') globalContext = true;
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
    await new ExampleEvaluator(
      filePath,
      packageDefinition,
      CWD,
      globalContext
        ? globalThis
        : {
            Buffer,
            process,
            Date,
            console,
            setTimeout,
            clearTimeout,
          },
    ).evaluate(blockIdx);
  }
}
