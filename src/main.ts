import * as core from '@actions/core'
import { exec } from '@actions/exec'
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
  const diffstat = await exec('git diff --numstat')
  core.setOutput('diffstat', diffstat)
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })