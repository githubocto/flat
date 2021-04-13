import * as core from '@actions/core'
import { exec } from '@actions/exec'

core.debug("Start post job debug")
core.info("Start post job")

const run = async () => {
  if (process.env.HAS_RUN_POST_JOB) return

  const files = JSON.parse(process.env.FILES || "[]")
  core.info("Running post-job script")

  const date = new Date().toISOString()
  const meta = JSON.stringify(
    {
      date,
      files,
    },
    undefined,
    2
  )
  const msg = `Flat: latest data (${date})`

  // these should already be staged, in main.ts
  core.info(`Committing "${msg}"`)
  core.debug(meta)
  await exec('git', ['commit', '-m', msg + '\n' + meta])
  await exec('git', ['push'])
  core.info(`Pushed!`)
  core.exportVariable('HAS_RUN_POST_JOB', "true");
}

run().catch(error => {
  core.setFailed('Post script failed! ' + error.message)
})
