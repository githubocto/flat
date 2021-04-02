import { parse } from 'https://deno.land/std/flags/mod.ts'
import * as path from 'https://deno.land/std@0.91.0/path/mod.ts'

const args = parse(Deno.args) // this gets the invocation args
// console.log('DENO ARGS: ', args)
// console.log('DENO CWD: ', Deno.cwd())
// console.log(
//   'DENO JOINED IMPORT PATH: ',
//   path.join(Deno.cwd(), args._[0] as string)
// )

// Get the name of the require script
// It must default export a function
// We invoke the function with the filename to process
const importPath = path.join(Deno.cwd(), args._[0] as string)
const fn: Function = (await import(importPath)).default

//console.log(fn(args._[1] as string))
console.log(args._[1] as string)
