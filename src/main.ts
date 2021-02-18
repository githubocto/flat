import * as core from '@actions/core'
import wretch from 'wretch'

wretch().polyfills({
  fetch: require('node-fetch')
})

core.info("flat-actions loaded")

async function run (): Promise<void> {
  core.info("flat-actions run() invoked")
  const url = core.getInput('url')
  if (!url) {
    core.setFailed('Workflow requires a url to fetch!')
    return;
  }
  core.debug(`** url is: "${url}"`)

  wretch(url)
    .get()
    .res(async response => {
      core.info(`Response!`)
      core.info(`Fetched: ${response.status} ${response.statusText}`)
      response.headers.forEach((v,k) => core.info(`  [${k}]: ${v}`))
      core.debug(await response.text())
    })
    .catch(error => {
      core.error(error)
    })
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })