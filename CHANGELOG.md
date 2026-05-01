# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## v1.0.1 - 2026-05-01

- make package Windows friendly

## v1.0.0 - 2026-04-26

Let Claude come in and fix stuff.

### Breaking changes

- CLI vm context defaults to `globalThis`; `-g` is now a silent no-op (`fetch`, `EventTarget`, `performance`, etc. available out of the box).
- `ExampleEvaluator`'s 4th constructor param renamed `sandbox` → `vmContext` and now defaults to `globalThis` when omitted.
- Config `require` entries are forwarded as `-r` setup files (run inside the vm context) instead of via Node's `--import` (host process).
- No auto-discovered config; `bin/texample.cjs` reads a config only when `-c <path>` is passed explicitly.
- `bin/texample.cjs` propagates the child's exit code (previously always 0).

### Features

- `-r <path>` CLI flag (repeatable): loads ESM setup files inside the example's vm context before the example runs; `lineOffset` stays relative to the markdown source.
- `-c <path>` CLI flag: JSON config with `require` (forwarded as `-r`, bare specifiers resolved via `node_modules`) and `node-option` (appended to the always-on `--experimental-vm-modules --no-warnings` defaults).
- `-?` CLI flag prints usage.
- `ExampleEvaluator` accepts a 5th param `setupFiles: string[]`.

## v0.1.0 - 2025-11-13

- package provenance release

## v0.0.8 - 2025-04-29

- update readme

## v0.0.7 - 2025-02-10

- bump some dev deps and some readme

## v0.0.6 - 2024-07-13

- introduce `-g` cli flag to work with modules with side effects

## v0.0.5 - 2024-05-19

- refactor script-linker to work with imported commonjs modules

## v0.0.4 - 2024-05-17

- forgot to update cli with new signature, and its not only script linker that got new signature but also the example evaluator

## v0.0.3 - 2024-05-17

- honor package.json exports
- change script linker signature to take entire package json instead of name and module
- change file cache to be a promised file cache
