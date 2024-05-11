# markdown-tester

[![Build](https://github.com/zerodep/markdown-tester/actions/workflows/build.yaml/badge.svg)](https://github.com/zerodep/markdown-tester/actions/workflows/build.yaml)[![Coverage Status](https://coveralls.io/repos/github/zerodep/markdown-tester/badge.svg?branch=main)](https://coveralls.io/github/zerodep/markdown-tester?branch=main)

# Example

Create a script that does the following:

```javascript
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';

import { ExampleEvaluator } from 'markdown-tester';

if (!('SourceTextModule' in vm)) throw new Error('No SourceTextModule in vm, try using node --experimental-vm-modules flag');

const CWD = process.cwd();

const nodeRequire = createRequire(fileURLToPath(import.meta.url));
const { name, module: myModule } = nodeRequire(resolvePath(CWD, 'package.json'));

const markdownFiles = process.argv[2] || './README.md';
const blockIdx = Number(process.argv[3]);

(async () => {
  for (const filePath of markdownFiles.split(',')) {
    await new ExampleEvaluator(filePath, name, myModule, CWD, {
      Buffer,
      console,
      setTimeout,
      clearTimeout,
    }).evaluate(blockIdx);
  }
})();
```
