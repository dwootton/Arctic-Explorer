#!/bin/env node

const fs = require('fs');

function splitFile(filename) {
    let contents = fs.readFileSync(filename, 'utf8');

    let cells = contents.split("\n").map(line => line.split(","));

    return cells.flat().map(d => d === "NaN" ? "0" : d).filter(d => d !== "");
}
 
let latdata = splitFile('data/latdata.csv');
let londata = splitFile('data/londata.csv');
let psidata = splitFile('data/psidata.csv');


if (latdata.length !== londata.length || londata.length != psidata.length) {
    throw new Error("something went very wrong!");
}

console.log("lat,lon,psi");
for (let i = 0; i < latdata.length; i++) {
    console.log(`${latdata[i]}, ${londata[i]}, ${psidata[i]}`);
}
