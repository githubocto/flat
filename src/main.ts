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

  if (config.postprocess) {
    core.startGroup('Postprocess')
    core.debug(`Invoking ${config.postprocess} with ${filename}...`)
    try {
      const raw = execSync(
        `deno run -q -A --unstable ${config.postprocess} ${filename}`
      ).toString()

      const lines = raw.trim().split('\n')
      const newFilename = lines[lines.length - 1]
      core.debug(`Postprocess returned filename: "${newFilename}"`)
      filename = newFilename
    } catch (error) {
      core.setFailed(error)
    }
    core.endGroup()
  }

  core.startGroup('Getting changed files')

  const newUnstagedFiles = await execSync(
    'git ls-files --others --exclude-standard'
  ).toString()
  const modifiedUnstagedFiles = await execSync('git ls-files -m').toString()
  core.info('newUnstagedFiles')
  core.info(newUnstagedFiles + '')
  core.info('modifiedUnstagedFiles')
  core.info(modifiedUnstagedFiles + '')
  core.info(typeof modifiedUnstagedFiles)

  core.endGroup()

  core.startGroup('Calculating diffstat')
  core.debug(`git adding ${filename}…`)
  await exec('git', ['add', filename])
  const bytes = await diff(filename)
  core.setOutput('delta_bytes', bytes)
  core.endGroup()

  core.startGroup('Committing new data')

  const alreadyEditedFiles = JSON.parse(process.env.FILES || '[]')
  core.info('alreadyEditedFiles')
  core.info(JSON.stringify(alreadyEditedFiles))

  const newFiles = [{ name: filename, deltaBytes: bytes, source }] // TODO: add other files
  const files = [...alreadyEditedFiles, ...newFiles]
  core.exportVariable('FILES', files)
  core.endGroup()
}

run().catch(error => {
  core.setFailed('Workflow failed! ' + error.message)
})
