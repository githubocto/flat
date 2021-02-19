import * as core from '@actions/core'
import wretch from 'wretch'
import { HTTPConfig } from '../config'

wretch().polyfills({
  fetch: require('node-fetch')
})

export default async function fetchHTTP(config: HTTPConfig): Promise<void> {
  core.debug('HTTP Fetch')
  core.debug(`  url: ${config.url}`)
  wretch(config.url)
    .get()
    .res(async response => {
      core.debug(`Fetched: ${config.url} ${response.status} ${response.statusText}`)
      const contentType = response.headers.get('content-type')

      response.headers.forEach((v,k) => core.info(`  [${k}]: ${v}`))
      
    })
    .catch(error => {
      core.error(error)
    })
}
