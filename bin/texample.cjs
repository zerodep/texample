#!/usr/bin/env node
'use strict';

const { fork } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const cli = require.resolve('../cli.cjs');

run();

function run() {
  const argv = process.argv.slice(2);
  let configPath;
  const childArgs = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-c') configPath = argv[++i];
    else childArgs.push(argv[i]);
  }

  const config = configPath ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const configDir = configPath ? path.dirname(configPath) : '.';
  const nodeOptions = ['experimental-vm-modules', 'no-warnings', ...(config['node-option'] ?? [])].map((o) => `--${o}`);
  const requires = (config.require ?? []).flatMap((r) => {
    const isPath = r.startsWith('.') || r.startsWith('/');
    return ['-r', isPath ? path.resolve(configDir, r) : require.resolve(r)];
  });

  const child = fork(cli, [...requires, ...childArgs], { execArgv: nodeOptions });
  child.on('exit', (code) => {
    process.exitCode = code ?? 0;
  });
}
