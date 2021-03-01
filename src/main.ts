import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { execSync } from 'child_process'
import fetchHTTP from './backends/http'
import fetchSQL from './backends/sql'
import { getConfig, isHTTPConfig, isSQLConfig } from './config'
import { diff } from './git'

async function run (): Promise<void> {
  core.info('[INFO] Usage https://github.com/githubocto/flat#readme')
  core.startGroup('Configuration')
  const config = getConfig()
  const username = process.env.GITHUB_ACTOR as string
  await exec('git', ['config', 'user.name', username])
  await exec('git', ['config', 'user.email', `${username}@users.noreply.github.com`])
  core.endGroup()

  core.startGroup('Fetch data')
  if (isHTTPConfig(config)) {
    await fetchHTTP(config)
  } else if (isSQLConfig(config)) {
    await fetchSQL(config)
  }
  core.endGroup()
  

  core.startGroup('Calculating diffstat')
  await exec('git', ['add', '-A'])
  const bytes = await diff()
  core.setOutput('delta_bytes', bytes)
  core.endGroup()

  if (bytes === 0) {
    return
  }

  core.startGroup('Committing new data')
  const msg = `Latest data: ${new Date().toISOString()} (${bytes > 0 && '+'}${bytes}b)`
  core.info(`Committing "${msg}"`)
  await exec('git', ['commit', '-m', msg])
  await exec('git', ['push'])
  core.endGroup()
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })
