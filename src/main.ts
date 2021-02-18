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
    .res(response => {
      core.info(`Fetched: ${response.type}`)
    })
    .catch(error => {
      core.error(error)
    })
}

run()
  .catch(error => {
    core.setFailed("Workflow failed! " + error.message)
  })