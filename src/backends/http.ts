import * as core from '@actions/core'
import { HTTPConfig } from '../config'
import fs from 'fs'
import axios from 'axios'

export default async function fetchHTTP(config: HTTPConfig): Promise<void> {
  core.info('Fetching: HTTP')
  try {
    const response = await axios({
      method: 'get',
      url: config.url,
      responseType: 'stream'
    })
    core.info(`Response: ${response.status} ${response.statusText}`)
    const contentType: string | null = response.headers['content-type']
    core.debug(`Content-type: ${contentType}`)
    response.data.pipe(fs.createWriteStream(`${config.outfile}.${config.format}`))      
  } catch (error) {
    core.setFailed(error)
  }
}
