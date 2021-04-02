import { parse } from 'https://deno.land/std@0.92.0/flags/mod.ts'
import * as path from 'https://deno.land/std@0.92.0/path/mod.ts'

// invocation args
const args = parse(Deno.args)

// build an absolute path to the postprocessing script
const importPath = path.join(Deno.cwd(), args._[0] as string)

// now import it
// It must default export a function
const fn: Function = (await import(importPath)).default

// We invoke the function with the filename to process
// The function must return the filename of the processed thing
console.log(args._[1] as string)
