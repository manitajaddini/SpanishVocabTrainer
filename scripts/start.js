#!/usr/bin/env node
const { run } = require('./run-pair');

run('npm', ['--workspace', 'server', 'run', 'start']);
run('npm', ['--workspace', 'frontend', 'run', 'preview']);
