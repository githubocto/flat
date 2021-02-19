import * as core from '@actions/core'
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
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })