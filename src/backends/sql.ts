import * as core from '@actions/core'
import { HTTPConfig, SQLConfig } from '../config'

export default async function fetchSQL(config: SQLConfig): Promise<void> {
  core.debug('SQL Fetch')
  core.debug(`  queryfile: ${config.queryfile}`)
  core.debug(`  connstring: ${config.connstring}`)
  core.error('SQL Fetching is not yet implemented!')
}
