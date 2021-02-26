import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { execSync } from 'child_process'
import fetchHTTP from './backends/http'
import fetchSQL from './backends/sql'
import { getConfig, isHTTPConfig, isSQLConfig } from './config'

async function run (): Promise<void> {
  core.info('[INFO] Usage https://github.com/githubocto/flat#readme')
  
  core.startGroup('Configuration')
  const config = getConfig()
  core.endGroup()

  core.startGroup('Fetch data')
  if (isHTTPConfig(config)) {
    fetchHTTP(config)
  } else if (isSQLConfig(config)) {
    fetchSQL(config)
  }
  core.endGroup()
  
  core.startGroup('Calculating diffstat')
  const diffstat = execSync('git diff --numstat').toString('utf8')
  core.info(diffstat)
  core.setOutput('diffstat', diffstat)
  core.endGroup()

  if (!diffstat) {
    return
  }

  core.startGroup('Committing new data')
  const username = process.env.GITHUB_ACTOR as string
  await exec('git', ['config', 'user.name', username])
  await exec('git', ['config', 'user.email', `${username}@users.noreply.github.com`])
  await exec('git', ['add', '-A'])
  const msg = `Latest data: ${new Date().toISOString()}`
  core.info(`Committing "${msg}"`)
  await exec('git', ['commit', '-m', msg])
  core.endGroup()
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })