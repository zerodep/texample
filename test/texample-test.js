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

  it('defaults vmContext to globalThis when not passed', () => {
    const evaluator = new ExampleEvaluator('./test/docs/escape-backticks.md', { name: 'texample', module: './src/index.js' }, '.');

    expect(evaluator.sandbox).to.equal(globalThis);
  });

  it("initializes setup file's import.meta.url to the setup file's URL", async () => {
    const probe = {};
    const evaluator = new ExampleEvaluator(
      './test/docs/escape-backticks.md',
      { name: 'texample', module: './src/index.js' },
      '.',
      { console: { log() {} }, probe },
      ['./test/docs/import-meta-probe/setup.mjs'],
    );

    await evaluator.evaluate();

    expect(probe.url).to.match(/test\/docs\/import-meta-probe\/setup\.mjs$/);
  });

  it('propagates errors thrown by a setupFiles entry with the stack pointing at the setup file', async () => {
    const evaluator = new ExampleEvaluator(
      './test/docs/escape-backticks.md',
      { name: 'texample', module: './src/index.js' },
      '.',
      { console: { log() {} } },
      ['./test/docs/throw-setup/setup.mjs'],
    );

    let err;
    try {
      await evaluator.evaluate();
    } catch (e) {
      err = e;
    }

    expect(err).to.have.property('message', 'boom from setup');
    // line 4 in setup.mjs is `throw new Error(reason);` — the example markdown
    // is never reached because the setup throws first.
    expect(err.stack).to.match(/throw-setup\/setup\.mjs:4:\d+/);
  });

  it('runs each setupFiles entry as ESM in the same vm context before example blocks (lineOffset stays relative to example source)', async () => {
    const evaluator = new ExampleEvaluator(
      './test/docs/deny-fetch/deny-fetch.md',
      { name: 'texample', module: './src/index.js' },
      '.',
      { console: { log() {} } },
      ['./test/docs/deny-fetch/deny-fetch-setup.mjs'],
    );

    let err;
    try {
      await evaluator.evaluate();
    } catch (e) {
      err = e;
    }

    expect(err).to.have.property('message', 'fetch denied');
    // line 7 in deny-fetch.md is `await fetch('https://example.com');` — pinning to
    // the exact line catches off-by-N regressions in lineOffset bookkeeping.
    expect(err.stack).to.match(/deny-fetch\.md:7:\d+/);
  });

  it('ignores escaped javascript block', async () => {
    const logLines = [];

    const evaluator = new ExampleEvaluator('./test/docs/escape-backticks.md', { name: 'texample', module: './src/index.js' }, '.', {
      console: {
        log(...args) {
          logLines.push(args);
        },
      },
    });

    await evaluator.evaluate();

    expect(logLines.length).to.be.above(1);
  });
});
