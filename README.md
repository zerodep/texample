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
- [`-r <path>`](#vm-context-setup) ESM file run inside the vm context before the example (repeatable)
- [`-c <path>`](#config-file) JSON config file with `require` and `node-option`
- `-i` exit 0 even when an example throws (errors still print to stderr)
- `-?` print usage and exit

```sh
texample ./README.md,./docs/API.md
```

The vm context is `globalThis`, so examples have access to `fetch`, `EventTarget`, `performance`, and the rest of Node's runtime by default. Each invocation runs in its own forked child process, so anything an example writes to `globalThis` is thrown away when the run ends.

## Vm context setup

Pass one or more `-r <path>` flags to evaluate ESM files inside the example's vm context before the example runs. Repeating the flag chains multiple setup files in order. Each file is loaded as a `SourceTextModule` sharing the example's context, so it can mutate the sandbox (e.g. replace `globalThis.fetch`, freeze `Date`) and the example sees those mutations. The example's `lineOffset` stays relative to the markdown source.

```sh
texample ./example.md -r ./deny-fetch.mjs -r ./mock-time.mjs
```

## Config file

`-c <path>` covers a different need than `-r`: it is for process-level setup that has to be in place before texample itself can run — Node CLI flags or modules that must be imported at process startup. There is no auto-discovered config file; pass one explicitly. The config is plain JSON:

```json
{
  "require": ["./deny-fetch-setup.mjs"],
  "node-option": ["experimental-vm-modules", "no-warnings"]
}
```

- `require` — list of files forwarded as `-r` setup files (resolved relative to the config file's directory; bare specifiers like `chai/register-expect.js` are resolved via `node_modules`). They run inside the example's vm context.
- `node-option` — entries are appended to the always-on defaults (`--experimental-vm-modules --no-warnings`) and forwarded as `--<option>` in the child's `execArgv`. You never need to redeclare the defaults — supplying `node-option` is purely additive.

```sh
texample ./example.md -c ./texample-config.json
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
