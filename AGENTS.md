# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm test` — runs mocha; `posttest` then runs lint and `dist`, so `npm test` is the full pre-commit gate.
- `npm run lint` — eslint (cached) + prettier check (cached).
- `npm run dist` — rollup bundles `src/index.js` → `dist/index.cjs` and `dts-buddy` regenerates `types/`. The `dist/` output is what `cli.cjs` actually loads at runtime, so changes in `src/` are not visible to the CLI until `dist` runs (this also runs on `prepare`).
- `npm run cov:html` / `npm run test:lcov` — coverage via c8.
- Run a single test: `npx mocha --grep 'honors block index'` (mocha is configured via `.mocharc.json` with `recursive` + `--experimental-vm-modules`; do not drop those flags).
- Try the CLI locally: `node bin/texample.cjs ./README.md` (or with `-g` for `globalThis` context, or a trailing integer to run only that block index).

## Architecture

The package evaluates ` ```javascript ` fenced blocks from a markdown file as real ES modules using Node's experimental `vm.SourceTextModule`. Blocks fenced with ` ```js ` are deliberately ignored (used to skip examples).

Three layers, top-down:

1. **`bin/texample.cjs`** — thin entry that `fork`s `cli.cjs` with `--experimental-vm-modules --no-warnings`. The fork is required because `vm.SourceTextModule` only exists under that flag; never call `cli.cjs` directly from production code paths.
2. **`cli.cjs`** — argv parsing (comma-separated file list, optional numeric block index, `-g` flag), loads the consumer's `package.json` from `process.cwd()`, builds the sandbox object, and instantiates `ExampleEvaluator`. With `-g`, `globalThis` is passed as the sandbox so side-effecting modules can mutate globals; otherwise a minimal `{ Buffer, process, Date, console, setTimeout, clearTimeout }` sandbox is used.
3. **`src/index.js` (`ExampleEvaluator`) + `src/script-linker.js` (`ScriptLinker`)** — the actual engine.

Inside the engine:

- `ExampleEvaluator.getBlocks()` regexes ` ```javascript\n…``` ` out of the file and tracks `lineOffset` per block by counting newlines from the previous match. The offset is fed to `vm.SourceTextModule` so stack traces point at the original markdown line — preserving these line numbers is the whole reason for the manual `calculateLineOffset` bookkeeping; do not collapse it into a simpler "split once" implementation.
- Each block gets its own `vm.createContext(sandbox, { name: packageDefinition.name })`. The sandbox is the _same object_ across blocks, so state leaks between examples by design (matches how a reader would execute them in sequence).
- `ScriptLinker.link` is the linker passed to `script.link()`. Resolution rules, in order:
  1. If the specifier starts with the consuming package's own `name`, resolve via `package.json` `exports['.'].import`, `exports['.<sub>'].import|require`, or fall back to top-level `module` / `main`. This is what lets a README do `import { foo } from 'my-package'` and have it resolve to the local source.
  2. If relative (`.` / `..`), resolve against the markdown file's directory.
  3. Otherwise, treat as a bare specifier and `await import(specifier)` — wrapping the result in a `vm.SyntheticModule` that re-exports every key. This is how `node:*` and `node_modules` deps reach the sandbox.
- The CJS build at `dist/index.cjs` is what published consumers run via the `bin`. Rollup is configured to keep `node:*` imports external; the footer `module.exports = Object.assign(exports.default, exports);` is intentional so both `require('texample')` and `require('texample').ExampleEvaluator` work.

## Working style

- **TDD.** Add or update a failing mocha test in `test/` (and a fixture under `test/docs/` or `test/src/` if needed) before changing `src/`. Run `npx mocha --grep '<name>'` to watch it fail, implement the change, then run the full `npm test` to confirm lint + dist still pass.
- **Null coalescing.** Prefer `??` and `??=` over `||` when guarding against `null`/`undefined`. The existing `exports?.['.']?.import || exports?.import || …` chain in `src/script-linker.js` is the one place `||` is load-bearing because `exports` entries are always strings or absent — new code should reach for `??` unless falsy-coalescing is genuinely intended.
- **Don't import `node:path` to absolutize cwd-relative paths.** `node:fs`, `child_process.fork/spawn`, and friends already resolve relatives against `process.cwd()`, and `fork`/`spawn` default `cwd` to the parent's. Pass the bare relative path (`'./cli.cjs'`, `'./test/docs/README.md'`). The `resolvePath(CWD, …)` calls inside `src/script-linker.js` are a different case — dynamic `import()` from the bundled `dist/index.cjs` resolves relatives against the bundle's location, not the consumer's cwd, so the absolute path there is load-bearing.

## Conventions worth knowing

- ESM source under `src/`, CommonJS for CLI shims (`bin/texample.cjs`, `cli.cjs`) so they can `require('node:vm')` synchronously before any module graph loads.
- JSDoc types reference the `types` path alias (see `tsconfig.json` `paths`). `tsconfig.json` has `checkJs: true` + `strict: true` (with `strictNullChecks: false`); `dts-buddy` produces the published `.d.ts`.
- The eslint config bans `console` (warning) and `process.exit` — `cli.cjs` opts out of `no-console` explicitly. Tests relax `no-unused-expressions` for chai's `expect(...).to.be...` style. `chai/register-expect.js` is auto-loaded via `.mocharc.json`, so `expect` is a global in tests.
- Test fixtures live in `test/docs/*.md` and `test/src/*` — they exercise: package self-import, sub-path exports, CJS-only `main`, `globalThis` sandbox, missing-export errors, and ` ``` ` escaping inside ` ```javascript ` blocks. When changing linker resolution, update the matching fixture rather than adding new branches in `script-linker.js`.
