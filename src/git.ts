import { exec, ExecOptions } from '@actions/exec'
import { statSync, existsSync } from 'fs'
import path from 'path'
import * as core from '@actions/core'
import { CONNREFUSED } from 'node:dns'

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
  switch (file.flag) {    
    case 'M': {
      const stat = statSync(file.path)
      core.debug(
        `Calculating diff for ${JSON.stringify(file)}, with size ${stat.size}b`
      )

      // get old size and compare
      const oldSize = await getHeadSize(file.path)
      const delta = oldSize === undefined ? stat.size : stat.size - oldSize
      core.debug(
        ` ==> ${file.path} modified: old ${oldSize}, new ${stat.size}, delta ${delta}b `
      )
      return delta
    }
    case 'A': {
      const stat = statSync(file.path)
      core.debug(
        `Calculating diff for ${JSON.stringify(file)}, with size ${stat.size}b`
      )

      core.debug(` ==> ${file.path} added: delta ${stat.size}b`)
      return stat.size
    }
    case 'D': {
      const oldSize = await getHeadSize(file.path)
      const delta = oldSize === undefined ? 0 : oldSize
      core.debug(` ==> ${file.path} deleted: delta ${delta}b`)
      return delta
    }
    default: {
      throw new Error(
        `Encountered an unexpected file status in git: ${file.flag} ${file.path}`
      )
    }
  }
}

export async function diff(filename: string): Promise<number> {
  const statuses = await gitStatus()
  core.debug(
    `Parsed statuses: ${statuses.map(s => JSON.stringify(s)).join(', ')}`
  )
  const status = statuses.find(s => path.relative(s.path, filename) === '')
  if (typeof status === 'undefined') {
    core.info(`No status found for ${filename}, aborting.`)
    return 0 // there's no change to the specified file
  }
  return await diffSize(status)
}

