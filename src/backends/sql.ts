import * as core from '@actions/core'
import { ConnectionString } from 'connection-string'
import { writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { createConnection, DatabaseType } from 'typeorm'
import { SQLConfig } from '../config'


// TODO: wish there was a dynamic way to import this for runtime usage from the DatabaseType type
const TYPEORM_PROTOCOLS = ["mysql", "postgres", "cockroachdb", "sap", "mariadb", "sqlite", "cordova", "react-native", "nativescript", "sqljs", "oracle", "mssql", "mongodb", "aurora-data-api", "aurora-data-api-pg", "expo", "better-sqlite3"]

function isValidDatabaseType(protocol: string): protocol is DatabaseType {
  return TYPEORM_PROTOCOLS.includes(protocol)
}

export default async function fetchSQL(config: SQLConfig): Promise<void> {
  let connection
  const query = await readFile(config.queryfile, {encoding: 'utf8'})
    .catch(err => {
      core.setFailed(err)
      throw err
    })
  
  const parsed = new ConnectionString(config.connstring)
  try {
    const protocol = parsed.protocol
    if (!protocol) {
      throw new Error('Unable to determine the database protocol from the connection string')
    }
    if (!isValidDatabaseType(protocol)) {
      throw new Error(`The '${protocol}' protocol is not supported. Please choose one of: ${TYPEORM_PROTOCOLS.join(', ')}`)
    }
    
    // @ts-ignore
    connection = await createConnection({
      type: protocol,
      url: config.connstring
    })

    
    
  } catch (error) {
    core.setFailed(`Unable to connect to database: ${error.message}`)
    throw error
  }

  let result
  try {
    result = await connection.query(query)
  } catch (error) {
    core.setFailed(`Unable to query database: ${error.message}`)
    throw error
  }

  const outfile = `${config.outfile}.${config.format}`
  try {
    writeFileSync(outfile, result)
  } catch (error) {
    core.setFailed(`Unable to write results to ${outfile}: ${error.message}`)
    throw error    
  }
}
