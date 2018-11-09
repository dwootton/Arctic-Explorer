#!/bin/env node

const fs = require('fs');


let contents = fs.readFileSync("psiMonthjson.json", 'utf8');

// https://stackoverflow.com/a/44748730
let fixed = '[' + contents.replace(/}/g, '},') + ']';

console.log(fixed);

JSON.parse(fixed);
