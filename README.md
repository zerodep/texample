# texample

Execute your README markdown javascript ESM examples to make sure they run as expected.

[![Build](https://github.com/zerodep/texample/actions/workflows/build.yaml/badge.svg)](https://github.com/zerodep/texample/actions/workflows/build.yaml)[![Coverage Status](https://coveralls.io/repos/github/zerodep/texample/badge.svg?branch=main)](https://coveralls.io/github/zerodep/texample?branch=main)

## CLI

Arguments

- List of markdown files separated by comma (,)
- Optional markdown block index number, from 0
- [`-g`](#global-context) run with globalThis as context

```sh
texample ./README.md,./docs/API.md
```

## Example

Create a script that does the following:

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

## Global context

Modules with side-effects should run with `-g` flag since they probably change globalThis assignments.

```sh
texample ./test/docs/globals.md -g
```
