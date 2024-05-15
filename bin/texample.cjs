#!/usr/bin/env node
'use strict';

const { fork } = require('node:child_process');

run();

function run() {
  fork('./cli.cjs', process.argv.splice(2), { CWD: __dirname, execArgv: ['--experimental-vm-modules', '--no-warnings'] });
}
