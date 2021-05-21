import * as core from '@actions/core'
import { exec } from '@actions/exec'

const run = async () => {
  core.startGroup('Post cleanup script')

  if (process.env.HAS_RUN_POST_JOB) {
    core.info('Files already committed')
    core.endGroup()
    return
  }

  const files = JSON.parse(process.env.FILES || '[]')

  const date = new Date().toISOString()
  const meta = JSON.stringify(
    {
      date,
      files,
    },
    undefined,
    2
  )
  // @ts-ignore
  console.defaultLog = console.log.bind(console)
  // @ts-ignore
  console.logs = []
  // @ts-ignore
  console.log = function () {
    // @ts-ignore
    console.defaultLog.apply(console, arguments)
    // @ts-ignore
    console.logs.push(Array.from(arguments))
  }
  console.log(meta)
  // @ts-ignore
  const obfuscatedMeta = console.logs[0][0]
  const msg = `Flat: latest data (${date})`

  // Don't want to commit if there aren't any files changed!
  if (!files.length) return

  // these should already be staged, in main.ts
  core.info(`Committing "${msg}"`)
  core.debug(meta)
  await exec('git', ['commit', '-m', msg + '\n' + obfuscatedMeta])
  await exec('git', ['push'])
  core.info(`Pushed!`)
  core.exportVariable('HAS_RUN_POST_JOB', 'true')

  core.endGroup()
}

run().catch(error => {
  core.setFailed('Post script failed! ' + error.message)
})
