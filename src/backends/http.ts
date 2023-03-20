import * as core from '@actions/core'
import { HTTPConfig } from '../config'
import fs from 'fs'
import axios, { AxiosResponse } from 'axios'

export default async function fetchHTTP(config: HTTPConfig): Promise<string> {
  core.info('Fetching: HTTP')

  // Authorization headers
  const auth = {
    authorization: config.authorization,
  }
  const authHeader = config.authorization ? auth : {}

  let response: AxiosResponse<any>

  try {
    if (config.axios_config) {
      const axiosConfig = fs.readFileSync(config.axios_config, {
        encoding: 'utf8',
      })

      const parsed = JSON.parse(axiosConfig)

      const combinedWithOtherConfigValues = {
        ...parsed,
        url: config.http_url,
        headers: {
          ...parsed.headers,
          ...authHeader,
        },
        responseType: 'stream',
      }

      response = await axios(combinedWithOtherConfigValues)
    } else {
      response = await axios.get(config.http_url, {
        method: 'get',
        responseType: 'stream',
        headers: {
          ...authHeader,
        },
      })
    }
    const filename = config.downloaded_filename
    const writer = fs.createWriteStream(filename)

    response.data.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    return filename
  } catch (error) {
    core.setFailed(error as Error)
    throw error
  }
}
