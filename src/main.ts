import core from '@actions/core'
import wretch from 'wretch'

wretch().polyfills({
  fetch: require('node-fetch')
})

async function run () {
  const url = core.getInput('url')
  if (!url) {
    core.setFailed('Workflow requires a url to fetch!')
    return;
  }
  wretch(url)
    .get()
    .res(response => {
      core.info(`Fetched: ${response.type}`)
    })
    .catch(error => {
      core.error(error)
    })
}