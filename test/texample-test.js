import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve as resolvePath } from 'node:path';

import ExampleEvaluator from '../src/index.js';

const CWD = process.cwd();

const nodeRequire = createRequire(fileURLToPath(import.meta.url));
const packageDefinition = nodeRequire(resolvePath(CWD, 'package.json'));

describe('markdown tester', () => {
  it('evaluates all javascript examples', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator('./test/docs/README.md', { name: 'texample', module: './src/index.js' }, '.', {
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

    const evaluator = new ExampleEvaluator('./README.md', packageDefinition, CWD, {
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

  it('honors passed name and flat exports', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator(
      './README.md',
      {
        name: packageDefinition.name,
        exports: {
          import: packageDefinition.exports['.'].import,
        },
      },
      CWD,
      {
        Date,
        process,
        console: {
          log(...args) {
            logLines.push(args);
          },
        },
      },
    );

    await evaluator.evaluate();

    expect(logLines.length).to.be.above(0);
  });

  it('honors passed name and module', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator(
      './test/docs/mymodule.md',
      {
        name: 'my-module',
        module: './test/src/my-module.mjs',
        exports: {
          '.': {
            import: './test/src/my-module.mjs',
          },
          './sub-module': {
            import: './test/src/sub-module.mjs',
          },
          './sub-require': {
            require: './test/src/sub-require.cjs',
          },
        },
      },
      CWD,
      {
        Date,
        console: {
          log(...args) {
            logLines.push(args);
          },
        },
      },
    );

    await evaluator.evaluate();

    expect(logLines.length).to.be.above(0);
  });

  it('uses passed package main if nothing else is found', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator(
      './test/docs/mycommonjs.md',
      {
        name: 'my-require',
        main: './test/src/sub-require.cjs',
      },
      CWD,
      {
        Date,
        console: {
          log(...args) {
            logLines.push(args);
          },
        },
      },
    );

    await evaluator.evaluate();

    expect(logLines.length).to.be.above(0);
  });

  it('honors block index', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator(
      './test/docs/mymodule.md',
      {
        name: 'my-module',
        module: './test/src/my-module.mjs',
        exports: {
          '.': {
            import: './test/src/my-module.mjs',
          },
          './sub-module': {
            import: './test/src/sub-module.mjs',
          },
          './sub-require': {
            require: './test/src/sub-require.cjs',
          },
        },
      },
      CWD,
      {
        Date,
        console: {
          log(...args) {
            logLines.push(args);
          },
        },
      },
    );

    await evaluator.evaluate();
    const allLogLinesLength = logLines.splice(0).length;

    await evaluator.evaluate(0);

    expect(logLines.length).to.be.above(0).and.below(allLogLinesLength);
  });

  it('can be ran with globalThis as context', async () => {
    const evaluator = new ExampleEvaluator(
      './test/docs/globals.md',
      {
        name: 'my-module',
        module: './test/src/my-module.mjs',
        exports: {
          '.': {
            import: './test/src/my-module.mjs',
          },
          './sub-module': {
            import: './test/src/sub-module.mjs',
          },
          './sub-require': {
            require: './test/src/sub-require.cjs',
          },
        },
      },
      CWD,
      globalThis,
    );

    await evaluator.evaluate();
  });

  it('throws if sub-module is not found among exports', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator(
      './test/docs/mymodule.md',
      {
        name: 'my-module',
        module: './test/src/my-module.mjs',
        exports: {
          '.': {
            import: './test/src/my-module.mjs',
          },
          './sub-sub-module': {
            import: './test/src/sub-module.mjs',
          },
          './sub-require': {
            require: './test/src/sub-require.cjs',
          },
        },
      },
      CWD,
      {
        Date,
        console: {
          log(...args) {
            logLines.push(args);
          },
        },
      },
    );

    try {
      await evaluator.evaluate();
    } catch (e) {
      // eslint-disable-next-line no-var
      var err = e;
    }

    expect(err).to.be.instanceof(Error).and.have.property('code', 'ERR_MODULE_NOT_FOUND');
  });

  it('throws if sub-module is used but no exports in package.json', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator(
      './test/docs/mymodule.md',
      {
        name: 'my-module',
        module: './test/src/my-module.mjs',
      },
      CWD,
      {
        Date,
        console: {
          log(...args) {
            logLines.push(args);
          },
        },
      },
    );

    try {
      await evaluator.evaluate();
    } catch (e) {
      // eslint-disable-next-line no-var
      var err = e;
    }

    expect(err).to.be.instanceof(Error).and.have.property('code', 'ERR_MODULE_NOT_FOUND');
  });
});
