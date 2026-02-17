'use strict';

const { execFile } = require('child_process');
const path = require('path');

const CLI = path.resolve(__dirname, '..', 'bin', 'hello.js');

function run(args = []) {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI, ...args], (error, stdout, stderr) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: error ? error.code : 0,
      });
    });
  });
}

describe('hello CLI', () => {
  test('prints "Hello, world!" with no arguments', async () => {
    const { stdout, stderr, exitCode } = await run();
    expect(stdout).toBe('Hello, world!');
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });

  test('--help prints usage information', async () => {
    const { stdout, exitCode } = await run(['--help']);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('--help');
    expect(stdout).toContain('--version');
    expect(exitCode).toBe(0);
  });

  test('--version prints the package version', async () => {
    const pkg = require('../package.json');
    const { stdout, exitCode } = await run(['--version']);
    expect(stdout).toBe(pkg.version);
    expect(exitCode).toBe(0);
  });

  test('--name personalizes the greeting', async () => {
    const { stdout, stderr, exitCode } = await run(['--name', 'Alice']);
    expect(stdout).toBe('Hello, Alice!');
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });

  test('-n short form personalizes the greeting', async () => {
    const { stdout, stderr, exitCode } = await run(['-n', 'Alice']);
    expect(stdout).toBe('Hello, Alice!');
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });

  test('--name without value prints error and exits 1', async () => {
    const { stdout, stderr, exitCode } = await run(['--name']);
    expect(stderr).toContain('Missing value for --name');
    expect(stdout).toBe('');
    expect(exitCode).toBe(1);
  });

  test('unknown flag prints error to stderr and exits 1', async () => {
    const { stdout, stderr, exitCode } = await run(['--foo']);
    expect(stderr).toContain('Unknown option: --foo');
    expect(stdout).toBe('');
    expect(exitCode).toBe(1);
  });
});
