#!/usr/bin/env node
'use strict';
const {main} = require('../lib/cli');
main(process.argv.slice(2)).then(code => {process.exitCode = code;}, error => {
  console.error('Error: ' + (error.message || error));
  process.exitCode = 1;
});
