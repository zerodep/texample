'use strict';

const vm = require('node:vm');
const { resolve: resolvePath } = require('node:path');
const process = require('node:process');

const { ExampleEvaluator } = require('./dist/index.cjs');

if (!('SourceTextModule' in vm)) throw new Error('No SourceTextModule in vm, try using node --experimental-vm-modules flag');

const CWD = process.cwd();

const packageDefinition = require(resolvePath(CWD, 'package.json'));

const markdownFiles = process.argv[2] || './README.md';
const blockIdx = Number(process.argv[3]);

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  process.exitCode = 1;
});

async function run() {
  for (const filePath of markdownFiles.split(',')) {
    await new ExampleEvaluator(filePath, packageDefinition, CWD, {
      Buffer,
      process,
      Date,
      console,
      setTimeout,
      clearTimeout,
    }).evaluate(blockIdx);
  }
}
