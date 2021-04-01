import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { execSync } from 'child_process'
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

  core.debug(`*** postprocess is: ${config.postprocess}`)

  core.debug('*** pwd')
  core.debug(execSync('pwd').toString())

  core.debug('*** ls')
  core.debug(execSync('ls').toString())

  core.debug('*** ls ~/work/_actions/githubocto/flat/postprocessing/src')
  core.debug(
    execSync('ls ~/work/_actions/githubocto/flat/postprocessing/src').toString()
  )

  core.debug(`*** GITHUB_ACTION: ${process.env['GITHUB_ACTION']}`)

  if (config.postprocess) {
    core.startGroup('Postprocess')
    try {
      // TODO: where is the shim at runtime?
      // ~/work/_actions/githubocto/flat/postprocessing/
      // /home/runner/work/_actions/githubocto/flat/postprocessing/
      // TODO: `Postprocessing` needs to be a branch identifier, how do we get this at runtime?
      filename = execSync(
        `deno run -A ~/work/_actions/githubocto/flat/postprocessing/postprocess/postprocess_shim.ts ${config.postprocess} ${filename}`
      ).toString()
    } catch (error) {
      core.setFailed(error)
    }
    core.endGroup()
  }

  core.startGroup('Calculating diffstat')
  await exec('git', ['add', '-A']) // TODO: should be filename instead of -A, but it fails otherwise
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
