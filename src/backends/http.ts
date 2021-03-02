import * as core from '@actions/core'
import { HTTPConfig } from '../config'
import fs from 'fs'
import axios, { AxiosResponse } from 'axios'
import { parse } from '@tinyhttp/content-disposition'
import { basename } from 'path'
import { extension } from 'es-mime-types'

export default async function fetchHTTP(config: HTTPConfig): Promise<void> {
  core.info('Fetching: HTTP')
  try {
    const response = await axios({
      method: 'get',
      url: config.http_url,
      responseType: 'stream'
    })

    const filename = determineFilename(response, config)
    response.data.pipe(fs.createWriteStream(filename))      
  } catch (error) {
    core.setFailed(error)
  }
}

function determineFilename(response: AxiosResponse, config: HTTPConfig): string {

  // if there's a content-disposition header, use that
  const cd = parse(response.headers['content-disposition'])
  if (cd.parameters?.filename) {
    return basename(cd.parameters.filename)
  }

  // otherwise, try to use content-type
  const contentType: string | undefined = response.headers['content-type']
  if (contentType && extension(contentType)) {
    return `${config.outfile_basename}.${extension(contentType)}`
  }

  // Failing that, use the base output filename
  core.warning(`Unable to determine an appropriate filename from content-disposition or content-type headers. Saving data to "${config.outfile_basename}" with no extension.`)
      return config.outfile_basename
}
