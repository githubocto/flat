import * as core from '@actions/core'
import { HTTPConfig } from '../config'
import fs from 'fs'
import path, { resolve } from 'path'
import axios from 'axios'


export default async function fetchHTTP(config: HTTPConfig): Promise<void> {
  core.debug('HTTP Fetch')
  core.debug(`  url: ${config.url}`)
  axios({
    method: 'get',
    url: config.url,
    responseType: 'stream'
  })
    .then(response => {
      core.debug(`Fetched: ${config.url} ${response.status} ${response.statusText}`)
      const contentType: string | null = response.headers['content-type']
      core.debug(`  content-type: ${contentType}`)
      response.data.pipe(fs.createWriteStream(`${config.outfile}.${config.format}`))
    })
    .catch(error => {
      core.setFailed(error)
    })
}
