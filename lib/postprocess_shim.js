"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mod_ts_1 = require("https://deno.land/std/flags/mod.ts");
const args = mod_ts_1.parse(Deno.args); // this gets the invocation args
console.log('DENO ARGS: ', args);
// Get the name of the require script
// It must default export a function
// We invoke the function with the filename to process
const fn = require(args._[1]);
fn(args._[0]);
