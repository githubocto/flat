import * as core from '@actions/core'
import { ConnectionString } from 'connection-string'
import { createWriteStream, readFileSync, writeFileSync } from 'fs'
import { createConnection, DatabaseType } from 'typeorm'
import { SQLConfig } from '../config'
import * as path from 'path'
import stringify from 'csv-stringify'

// TODO: wish there was a dynamic way to import this for runtime usage from the DatabaseType type
const TYPEORM_PROTOCOLS = [
  'mysql',
  'postgres',
  'cockroachdb',
  'sap',
  'mariadb',
  'sqlite',
  'cordova',
  'react-native',
  'nativescript',
  'sqljs',
  'oracle',
  'mssql',
  'mongodb',
  'aurora-data-api',
  'aurora-data-api-pg',
  'expo',
  'better-sqlite3',
]

function isValidDatabaseType(protocol: string): protocol is DatabaseType {
  return TYPEORM_PROTOCOLS.includes(protocol)
}

export default async function fetchSQL(config: SQLConfig): Promise<void> {
  core.info('Fetching: SQL')
  let connection
  let query

  core.debug('Reading query file')
  try {
    const queryfilepath = path.join('.github/workflows', config.sql_queryfile)
    core.debug(queryfilepath)
    query = readFileSync(queryfilepath, { encoding: 'utf8' })
  } catch (error) {
    core.setFailed(
      `Unable to read queryfile ${config.sql_queryfile}: ${error.message}`
    )
    throw error
  }

  core.debug('Connecting to database')
  const parsed = new ConnectionString(config.sql_connstring)
  try {
    const protocol = parsed.protocol
    if (!protocol) {
      throw new Error(
        'Unable to determine the database protocol from the connection string'
      )
    }
    if (!isValidDatabaseType(protocol)) {
      throw new Error(
        `The '${protocol}' protocol is not supported. Please choose one of: ${TYPEORM_PROTOCOLS.join(
          ', '
        )}`
      )
    }

    // @ts-ignore
    connection = await createConnection({
      type: protocol,
      url: config.sql_connstring,
    })
  } catch (error) {
    core.setFailed(`Unable to connect to database: ${error.message}`)
    throw error
  }

  core.info('Querying database')
  let result
  try {
    result = await connection.query(query)
  } catch (error) {
    core.setFailed(`Unable to query database: ${error.message}`)
    throw error
  }

  const outfile = `${config.outfile_basename}.${config.sql_format}`
  try {
    switch (config.sql_format) {
      case 'csv':
        core.info('Writing CSV')
        const ws = createWriteStream(outfile, { encoding: 'utf8' })
        await stringify(result, {
          header: true,
        }).pipe(ws)
        break

      default:
        core.info('Writing JSON')
        await writeFileSync(outfile, JSON.stringify(result))
    }
  } catch (error) {
    core.setFailed(`Unable to write results to ${outfile}: ${error.message}`)
    throw error
  }
}
