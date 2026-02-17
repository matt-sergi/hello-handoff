#!/usr/bin/env node

'use strict';

const pkg = require('../package.json');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: hello [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version number`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version);
  process.exit(0);
}

if (args.length > 0) {
  console.error(`Unknown option: ${args[0]}`);
  process.exit(1);
}

console.log('Hello, world!');
