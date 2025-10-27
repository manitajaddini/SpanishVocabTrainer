#!/usr/bin/env node
const { spawn } = require('child_process');

const processes = [];
let shuttingDown = false;

const run = (command, args) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  processes.push(child);
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      stopAll(code ?? 1);
    }
  });
};

const stopAll = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  processes.forEach((proc) => {
    if (!proc.killed) {
      proc.kill();
    }
  });
  setTimeout(() => process.exit(code), 10);
};

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

module.exports = { run, stopAll };
