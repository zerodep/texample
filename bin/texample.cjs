#!/usr/bin/env node
'use strict';

const { fork } = require('node:child_process');

const cli = require.resolve('../cli.cjs');

run();

function run() {
  fork(cli, process.argv.splice(2), { CWD: __dirname, execArgv: ['--experimental-vm-modules', '--no-warnings'] });
}
