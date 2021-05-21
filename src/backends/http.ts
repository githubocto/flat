import * as core from '@actions/core'
import { HTTPConfig } from '../config'
import fs from 'fs'
import axios from 'axios'

export default async function fetchHTTP(config: HTTPConfig): Promise<string> {
  core.info('Fetching: HTTP')
  try {
    const response = await axios.get(config.http_url, {
      method: 'get',
      responseType: 'stream',
      headers: {
        authorization: config.authorization,
      },
    })
    const filename = config.downloaded_filename
    const writer = fs.createWriteStream(filename)
    let bytesWritten = 0
    response.data.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    return filename
  } catch (error) {
    core.setFailed(error)
    throw error
  }
}