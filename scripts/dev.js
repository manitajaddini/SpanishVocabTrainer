#!/usr/bin/env node
const { run } = require('./run-pair');

run('npm', ['--workspace', 'server', 'run', 'dev']);
run('npm', ['--workspace', 'frontend', 'run', 'dev']);
