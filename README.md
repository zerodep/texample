# texample

Execute your README markdown javascript ESM examples to make sure they run as expected.

[![Build](https://github.com/zerodep/texample/actions/workflows/build.yaml/badge.svg)](https://github.com/zerodep/texample/actions/workflows/build.yaml)[![Coverage Status](https://coveralls.io/repos/github/zerodep/texample/badge.svg?branch=main)](https://coveralls.io/github/zerodep/texample?branch=main)

## Introduction

If you have been a decent chap you probably have decorated your module with lots of code examples in accordance with the "Show me the code"-motto. To be sure that your examples run as expected you can run through them with this module. Wrap your examples with:

` ```javascript `

and run through your README.md with:

```sh
texample ./README.md
```

Any irregularities will be printed to stdout, as well as `console.logs`. E.g:

```sh
0: file:///usr/local/src/projects/zerodep/piso/README.md:31
{ '2007-03-01/2007-04-01': 2007-03-31T22:00:00.000Z }
1: file:///usr/local/src/projects/zerodep/piso/README.md:59
{ PT1M5S: 2025-04-29T04:31:34.219Z }
{
  err: RangeError: ISO 8601 duration fractions are allowed on the smallest unit in the string, e.g. P0.5D or PT1.001S but not P0.5DT1H
      at ISODuration.writeDuration [as write] (file:///usr/local/src/projects/zerodep/piso/src/index.js:969:11)
      at ISODuration.parseDuration [as parse] (file:///usr/local/src/projects/zerodep/piso/src/index.js:900:10)
      at ISOInterval.consumeDuration (file:///usr/local/src/projects/zerodep/piso/src/index.js:274:76)
      at ISOInterval.parseInterval [as parse] (file:///usr/local/src/projects/zerodep/piso/src/index.js:109:10)
      at parseDuration (file:///usr/local/src/projects/zerodep/piso/src/index.js:1299:39)
      at file:///usr/local/src/projects/zerodep/piso/README.md:89:3
      at SourceTextModule.evaluate (node:internal/vm/module:229:23)
      at ExampleEvaluator.evaluate (/usr/local/src/projects/zerodep/piso/node_modules/texample/dist/index.cjs:125:20)
      at async run (/usr/local/src/projects/zerodep/piso/node_modules/texample/cli.cjs:34:5)
}
2: file:///usr/local/src/projects/zerodep/piso/README.md:103
SyntaxError: The requested module '@0dep/piso' does not provide an export named 'getDates'
    at SourceTextModule.link (node:internal/vm/module:203:17)
    at async ExampleEvaluator.evaluate (/usr/local/src/projects/zerodep/piso/node_modules/texample/dist/index.cjs:124:7)
    at async run (/usr/local/src/projects/zerodep/piso/node_modules/texample/cli.cjs:34:5)
```

Examples are numbered from 0.

To ignore an example snippet use ` ```js `.

## CLI

Arguments

- List of markdown files separated by comma (,)
- Optional markdown block index number, from 0
- [`-g`](#global-context) run with globalThis as vm context

```sh
texample ./README.md,./docs/API.md
```

## Global context

Modules with side-effects should run with `-g` flag since they probably change globalThis assignments.

```sh
texample ./test/docs/globals.md -g
```

## Customization example

You can write your own evaluator and pass a different vm context. Create a script that does the following:

```javascript
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';

import { ExampleEvaluator } from 'texample';

if (!('SourceTextModule' in vm)) throw new Error('No SourceTextModule in vm, try using node --experimental-vm-modules flag');

const CWD = process.cwd();

const nodeRequire = createRequire(fileURLToPath(import.meta.url));
const packageDefinition = nodeRequire(resolvePath(CWD, 'package.json'));

const markdownFiles = process.argv[2] || './README.md';
const blockIdx = Number(process.argv[3]);

(async () => {
  for (const filePath of markdownFiles.split(',')) {
    await new ExampleEvaluator(filePath, packageDefinition, CWD, {
      Buffer,
      console,
      setTimeout,
      clearTimeout,
    }).evaluate(blockIdx);
  }
})();
```
