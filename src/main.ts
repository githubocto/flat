import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { execSync } from 'child_process'
import fetchHTTP from './backends/http'
import fetchSQL from './backends/sql'
import { getConfig, isHTTPConfig, isSQLConfig } from './config'

async function run (): Promise<void> {
  const config = getConfig()
  if (isHTTPConfig(config)) {
    fetchHTTP(config)
  } else if (isSQLConfig(config)) {
    fetchSQL(config)
  }
  core.info(`GITHUB_WORKSPACE : ${process.env['GITHUB_WORKSPACE']}`)
  const pwd = execSync('pwd').toString('utf8')
  core.info(`cwd: ${pwd}`)
  const diffstat = execSync('git diff --numstat').toString('utf8')
  core.info(diffstat)
  core.setOutput('diffstat', diffstat)
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })