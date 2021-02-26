import { exec, ExecOptions } from '@actions/exec'
import { statSync } from 'fs'
import * as core from '@actions/core'

export type GitStatus = {
  flag: string,
  path: string
}

function withListenerOpts(s: string): ExecOptions  {
  return {
    listeners: {
      stdout: (data: Buffer) => {
        s += data.toString()
      }
    }
  }
}

export async function gitStatus(): Promise<GitStatus[]> {
  core.debug('Getting gitStatus()')
  let output = ''
  await exec('git', ['status', '-s'], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    }
  })
  core.debug(`=== output was:\n${output}`)
  return output.split('\n').filter(l => l != '').map(l => {
    const chunks = l.trim().split(/\s+/)
    return {
      flag: chunks[0],
      path: chunks[1]
    } as GitStatus
  })
}

async function getHeadSize(path: string): Promise<number | undefined> {
  let raw = ''
  const exitcode = await exec('git', ['cat-file', '-s', `HEAD:${path}`], withListenerOpts(raw))
  if (exitcode === 0) {
    return parseInt(raw, 10)
  }
}

async function diffSize(file: GitStatus): Promise<number> {
  const stat = statSync(file.path)    
    switch (file.flag) {
      case 'M':
        // get old size and compare
        const oldSize = await getHeadSize(file.path)
        return oldSize === undefined ? stat.size : stat.size - oldSize
      
      case 'A':
        return stat.size

      default:
        throw new Error(`Encountered an unexpected file status in git: ${file.flag} ${file.path}`)
    }
}

export async function diff(): Promise<number> {
  const statuses = await gitStatus()
  core.debug(`Parsed statuses: ${statuses.map(s=>JSON.stringify(s)).join(', ')}`)
  statuses.forEach(s => core.debug(`${s.flag} ${s.path}`))
  const sizes = await Promise.all(statuses.map(diffSize))
  return sizes.reduce((acc, cur) => acc + cur)
}