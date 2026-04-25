import { fork } from 'node:child_process';

const CLI = './cli.cjs';

function runCli(args = []) {
  return new Promise((resolve, reject) => {
    const child = fork(CLI, args, {
      execArgv: ['--experimental-vm-modules', '--no-warnings'],
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stdout, stderr }));
  });
}

describe('cli', () => {
  it('evaluates every javascript block of the passed markdown file', async () => {
    const { code, stdout } = await runCli(['./test/docs/README.md']);

    expect(code).to.equal(0);
    const headers = stdout.match(/^\d+: file:\/\/.+test\/docs\/README\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(7);
    expect(headers[0]).to.match(/^0: /);
  });

  it('runs each file when passed a comma-separated list', async () => {
    const { code, stdout } = await runCli(['./test/docs/escape-backticks.md,./test/docs/README.md']);

    expect(code).to.equal(0);
    expect(stdout).to.match(/escape-backticks\.md:\d+/);
    expect(stdout).to.match(/test\/docs\/README\.md:\d+/);
  });

  it('honors the numeric block index argument and runs only that block', async () => {
    const { code, stdout } = await runCli(['./test/docs/README.md', '0']);

    expect(code).to.equal(0);
    const headers = stdout.match(/^\d+: file:\/\/.+test\/docs\/README\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(1);
    expect(headers[0]).to.match(/^0: /);
  });

  it('runs with -g and uses globalThis as the vm context for global side-effects', async () => {
    const { code, stderr } = await runCli(['./test/docs/globals.md', '-g']);

    expect(code, stderr).to.equal(0);
  });

  it('ignores ```js blocks while picking up every ```javascript block (including indented ones)', async () => {
    const { code, stdout } = await runCli(['./test/docs/escape-backticks.md']);

    expect(code).to.equal(0);
    const logs = stdout.match(/^Not ignored$/gm) ?? [];
    expect(logs.length).to.equal(2);
  });

  it('prints usage to stdout and exits 0 when called with -?', async () => {
    const { code, stdout, stderr } = await runCli(['-?']);

    expect(code, stderr).to.equal(0);
    expect(stdout).to.match(/usage/i);
    expect(stdout).to.match(/-g/);
    expect(stdout).to.match(/-\?/);
  });

  it('exits with code 1 and writes to stderr when the markdown file does not exist', async () => {
    const { code, stderr } = await runCli(['./does-not-exist.md']);

    expect(code).to.equal(1);
    expect(stderr).to.match(/ENOENT|no such file/i);
  });
});
