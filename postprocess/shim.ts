import { parse } from 'https://deno.land/std/flags/mod.ts'
const args = parse(Deno.args) // this gets the invocation args
console.log('DENO ARGS: ', args)

// Get the name of the require script
// It must default export a function
// We invoke the function with the filename to process
const fn: Function = (await import(args._[1] as string)).default

fn(args._[0] as string)
