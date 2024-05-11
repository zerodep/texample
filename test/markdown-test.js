import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';

import ExampleEvaluator from '../src/index.js';

const CWD = process.cwd();

const nodeRequire = createRequire(fileURLToPath(import.meta.url));
const { name, module: myModule } = nodeRequire(resolvePath(CWD, 'package.json'));

describe('markdown tester', () => {
  it('evaluates all javascript examples', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator('./test/docs/README.md', 'markdown-tester', './src/index.js', '.', {
      Date,
      console: {
        log(...args) {
          logLines.push(args);
        },
      },
    });
    await evaluator.evaluate();

    expect(logLines.length).to.be.above(0);
  });

  it('resolves package module', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator('./README.md', name, myModule, CWD, {
      Date,
      process: {
        argv: [],
        cwd() {
          return CWD;
        },
      },
      console: {
        log(...args) {
          logLines.push(args);
        },
      },
    });
    await evaluator.evaluate();

    expect(logLines.length).to.be.above(0);
  });

  it('honors passed name and module', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator('./test/docs/mymodule.md', 'my-module', './test/src/my-module.mjs', CWD, {
      Date,
      console: {
        log(...args) {
          logLines.push(args);
        },
      },
    });

    await evaluator.evaluate();

    console.log(logLines);

    expect(logLines.length).to.be.above(0);
  });
});
