# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.0.6] - 2024-07-123

- introduce `-g` cli flag to work with modules with side effects

## [0.0.5] - 2024-05-19

- refactor script-linker to work with imported commonjs modules

## [0.0.4] - 2024-05-17

- forgot to update cli with new signature, and its not only script linker that got new signature but also the example evaluator

## [0.0.3] - 2024-05-17

- honor package.json exports
- change script linker signature to take entire package json instead of name and module
- change file cache to be a promised file cache
