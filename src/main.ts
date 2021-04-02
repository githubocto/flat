import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { execSync } from 'child_process'
import { join } from 'path'
import fetchHTTP from './backends/http'
import fetchSQL from './backends/sql'
import { getConfig, isHTTPConfig, isSQLConfig } from './config'
import { diff } from './git'

async function run(): Promise<void> {
  core.info('[INFO] Usage https://github.com/githubocto/flat#readme')
  core.startGroup('Configuration')
  const config = getConfig()
  const username = 'flat-data'
  await exec('git', ['config', 'user.name', username])
  await exec('git', [
    'config',
    'user.email',
    `${username}@users.noreply.github.com`,
  ])
  core.endGroup()

  core.startGroup('Fetch data')
  let filename = ''
  let source
  if (isHTTPConfig(config)) {
    filename = await fetchHTTP(config)
    source = config.http_url
  } else if (isSQLConfig(config)) {
    filename = await fetchSQL(config)
  } else {
    // typescript should preclude us from ever being here
    // because config is HTTPConfig | SQLConfig
    // But to be on the safe side, blow up if execution
    // has reached this point.
    core.setFailed('Unable to read a coherent action configuration')
  }
  core.endGroup()

  core.debug('info before postproc')
  core.debug(execSync(`ls -la`).toString())

  if (config.postprocess) {
    core.startGroup('Postprocess')
    try {
      // Severe ridiculousness here
      // ncc uses webpack to figure out what to bundle
      // Slight variations on the arguments to join() can result in webpack
      // thinking that it's a dynamic import of shim.ts, which will fail
      // because it's actually a deno script. Webpack doesn't have a way
      // to override the dynamic import detection:
      //   https://github.com/webpack/webpack/issues/8826
      // So, the following works, but it's finicky, beware, be warned.
      // const shim = '../postprocess/shim.ts'
      const raw = execSync(
        `deno run -q -A ${config.postprocess} ${filename}`
      ).toString()

      const lines = raw.trim().split('\n')
      core.debug('*** raw')
      core.debug(raw)
      const newFilename = lines[lines.length - 1]
      core.debug(`Postprocessing filename returned: ${newFilename}`)
      filename = newFilename
    } catch (error) {
      core.setFailed(error)
    }
    core.endGroup()
  }

  core.debug('info after postproc')
  core.debug(execSync(`ls -la`).toString())

  core.startGroup('Calculating diffstat')
  core.debug(`git adding ${filename}…`)
  await exec('git', ['add', filename])
  const bytes = await diff()
  core.setOutput('delta_bytes', bytes)
  core.endGroup()

  if (bytes === 0) {
    return
  }

  core.startGroup('Committing new data')
  const sign = bytes >= 0 ? '+' : ''
  const date = new Date().toISOString()
  const msg = `Latest data: ${date} (${sign}${bytes}b)`
  const meta = JSON.stringify(
    {
      files: [{ name: filename, deltaBytes: bytes, date, source }],
    },
    undefined,
    2
  )
  core.info(`Committing "${msg}"`)
  core.debug(meta)
  await exec('git', ['commit', '-m', msg + '\n' + meta])
  await exec('git', ['push'])
  core.endGroup()
}

run().catch(error => {
  core.setFailed('Workflow failed! ' + error.message)
})
