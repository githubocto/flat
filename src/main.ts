import * as core from '@actions/core'
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
  const diffstat = execSync('git diff --numstat')
  core.setOutput('diffstat', diffstat)
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })