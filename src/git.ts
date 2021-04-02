import { exec, ExecOptions } from '@actions/exec'
import { statSync } from 'fs'
import * as core from '@actions/core'

export type GitStatus = {
  flag: string
  path: string
}

export async function gitStatus(): Promise<GitStatus[]> {
  core.debug('Getting gitStatus()')
  let output = ''
  await exec('git', ['status', '-s'], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString()
      },
    },
  })
  core.debug(`=== output was:\n${output}`)
  return output
    .split('\n')
    .filter(l => l != '')
    .map(l => {
      const chunks = l.trim().split(/\s+/)
      return {
        flag: chunks[0],
        path: chunks[1],
      } as GitStatus
    })
}

async function getHeadSize(path: string): Promise<number | undefined> {
  let raw = ''
  const exitcode = await exec('git', ['cat-file', '-s', `HEAD:${path}`], {
    listeners: {
      stdline: (data: string) => {
        raw += data
      },
    },
  })
  core.debug(`raw cat-file output: ${exitcode} '${raw}'`)
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
      core.debug(`oldsize: ${oldSize}`)
      return oldSize === undefined ? stat.size : stat.size - oldSize

    case 'A':
      return stat.size

    default:
      throw new Error(
        `Encountered an unexpected file status in git: ${file.flag} ${file.path}`
      )
  }
}

export async function diff(filename: string): Promise<number> {
  const statuses = await gitStatus()
  core.debug(
    `Parsed statuses: ${statuses.map(s => JSON.stringify(s)).join(', ')}`
  )
  const status = statuses.find(s => s.path === filename)
  if (typeof status === 'undefined') {
    throw new Error(`Did not find a git status for "${filename}"`)
  }
  return await diffSize(status)
}
