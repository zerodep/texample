import { fork } from 'node:child_process';
import { symlinkSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CLI = './cli.cjs';
const BIN = fileURLToPath(new URL('../bin/texample.cjs', import.meta.url));

// Normalize CRLF to LF so multiline regex anchors (`$`) work cross-platform —
// JS /m only treats `\n` as a line terminator, so a stray `\r` before `\n` on
// Windows blocks `…:\d+$` from matching.
function normalize(s) {
  return s.replace(/\r\n/g, '\n');
}

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
    child.on('exit', (code) => resolve({ code, stdout: normalize(stdout), stderr: normalize(stderr) }));
  });
}

function runBin(args = []) {
  return new Promise((resolve, reject) => {
    const child = fork(BIN, args, {
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stdout: normalize(stdout), stderr: normalize(stderr) }));
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

  it('runs each file in the order given when passed as separate arguments', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/escape-backticks.md', './test/docs/README.md']);

    expect(code, stderr).to.equal(0);
    const headers = stdout.match(/^0: file:\/\/.+test\/docs\/[^/]+\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(2);
    expect(headers[0]).to.match(/escape-backticks\.md:\d+$/);
    expect(headers[1]).to.match(/README\.md:\d+$/);
  });

  it('expands a glob pattern with node:fs glob and runs the matches in sorted order', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/[Re]*.md']);

    expect(code, stderr).to.equal(0);
    const headers = stdout.match(/^0: file:\/\/.+test\/docs\/[^/]+\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(2);
    expect(headers[0]).to.match(/README\.md:\d+$/);
    expect(headers[1]).to.match(/escape-backticks\.md:\d+$/);
  });

  it('runs a file once however many arguments name or match it', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/README.md', './test/docs/[R]*.md', 'test/docs/README.md']);

    expect(code, stderr).to.equal(0);
    const headers = stdout.match(/^0: file:\/\/.+test\/docs\/README\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(1);
  });

  describe('symlinks', () => {
    const link = './test/docs/README-link.md';
    const linkedDir = './test/linked-docs';

    before(function linkReadme() {
      try {
        symlinkSync('README.md', link);
        symlinkSync('docs', linkedDir);
      } catch (err) {
        // Windows needs elevated rights or developer mode to create symlinks
        if (err.code === 'EPERM') this.skip();
        else throw err;
      }
    });

    after(() => {
      rmSync(link, { force: true });
      rmSync(linkedDir, { force: true });
    });

    it('silently skips a file reached through a symlinked directory, whether listed or matched by a glob', async () => {
      const { code, stdout, stderr } = await runCli([
        `${linkedDir}/escape-backticks.md`,
        `${linkedDir}/escape-*.md`,
        './test/**/escape-backticks.md',
      ]);

      expect(code, stderr).to.equal(0);
      expect(stderr).to.equal('');
      const headers = stdout.match(/^0: file:\/\/.+escape-backticks\.md:\d+$/gm) ?? [];
      expect(headers.length, 'only the real path runs, once').to.equal(1);
      expect(headers[0]).to.match(/test\/docs\/escape-backticks\.md/);
    });

    it('silently skips a symlink, whether listed or matched by a glob', async () => {
      const { code, stdout, stderr } = await runCli([link, './test/docs/*-link.md', './test/docs/escape-backticks.md']);

      expect(code, stderr).to.equal(0);
      expect(stdout).to.not.match(/README-link\.md/);
      expect(stdout).to.match(/escape-backticks\.md:\d+/);
      expect(stderr).to.equal('');
    });
  });

  it('warns on stderr and exits 0 when a glob pattern matches nothing', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/nope-*.md']);

    expect(code, stderr).to.equal(0);
    expect(stdout).to.equal('');
    expect(stderr).to.match(/^\.\/test\/docs\/nope-\*\.md: no matching file, skipped\.$/m);
  });

  it('honors the numeric block index argument and runs only that block', async () => {
    const { code, stdout } = await runCli(['./test/docs/README.md', '0']);

    expect(code).to.equal(0);
    const headers = stdout.match(/^\d+: file:\/\/.+test\/docs\/README\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(1);
    expect(headers[0]).to.match(/^0: /);
  });

  it('applies the block index to every file passed as separate arguments', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/escape-backticks.md', './test/docs/README.md', '1']);

    expect(code, stderr).to.equal(0);
    const headers = stdout.match(/^\d+: file:\/\/.+test\/docs\/[^/]+\.md:\d+$/gm) ?? [];
    expect(headers.length).to.equal(2);
    expect(headers[0]).to.match(/^1: .+escape-backticks\.md:\d+$/);
    expect(headers[1]).to.match(/^1: .+README\.md:\d+$/);
  });

  it('runs the globals.md example using globalThis as the vm context (default)', async () => {
    const { code, stderr } = await runCli(['./test/docs/globals.md']);

    expect(code, stderr).to.equal(0);
  });

  it('runs examples that import JSON with import attributes', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/import-json.md']);

    expect(code, stderr).to.equal(0);
    expect(stdout).to.match(/^static: baz$/m);
    expect(stdout).to.match(/^bare: chai$/m);
    expect(stdout).to.match(/^dynamic: baz$/m);
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
    expect(stdout).to.match(/-r/);
    expect(stdout).to.match(/-c/);
    expect(stdout).to.match(/-\?/);
  });

  it('freezes Date via -r chronokinesis setup, asserts with chai expect, sees NODE_ENV=test from .mocharc.json via -c', async () => {
    const { code, stderr } = await runBin([
      './test/docs/frozen-date/frozen-date.md',
      '-r',
      './test/docs/frozen-date/frozen-date-setup.mjs',
      '-c',
      './.mocharc.json',
    ]);

    expect(code, stderr).to.equal(0);
  });

  it('-r loads mocha and nock so the example can use describe/it/expect against an intercepted fetch', async () => {
    const { code, stderr } = await runCli([
      './test/docs/mocha-example/mocha-example.md',
      '-r',
      './test/docs/mocha-example/mocha-setup.mjs',
    ]);

    expect(code, stderr).to.equal(0);
  });

  it('runs every -r <path> file in the vm context before the example, allowing fetch to be intercepted by nock', async () => {
    const { code, stderr } = await runCli(['./test/docs/mock-fetch/mock-fetch.md', '-r', './test/docs/mock-fetch/mock-fetch-setup.mjs']);

    expect(code, stderr).to.equal(0);
  });

  it('reads the config passed via -c <path> and applies require + node-option to the child process', async () => {
    const { code, stderr } = await runBin(['./test/docs/mock-fetch/mock-fetch.md', '-c', './test/docs/mock-fetch/texample-config.json']);

    expect(code, stderr).to.equal(0);
  });

  it('-i silences the failure exit code while still writing the error to stderr', async () => {
    const { code, stderr } = await runCli(['./does-not-exist.md', '-i']);

    expect(code).to.equal(0);
    expect(stderr).to.match(/ENOENT|no such file/i);
  });

  it('exits with code 1 and writes to stderr when the markdown file does not exist', async () => {
    const { code, stderr } = await runCli(['./does-not-exist.md']);

    expect(code).to.equal(1);
    expect(stderr).to.match(/ENOENT|no such file/i);
  });

  it('takes a comma as part of the file name, not as a separator', async () => {
    const { code, stdout, stderr } = await runCli(['./test/docs/escape-backticks.md,./test/docs/README.md']);

    expect(code).to.equal(1);
    expect(stdout).to.equal('');
    expect(stderr).to.match(/ENOENT|no such file/i);
  });
});
