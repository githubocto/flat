import * as core from '@actions/core'
import * as z from 'zod'

const FormatEnum = z.enum(['csv', 'json'])
export type FormatEnum = z.infer<typeof FormatEnum>

const CommonConfigSchema = z.object({
  outfile_basename: z.string(),
  postprocess: z.string().optional(),
})
export type CommonConfig = z.infer<typeof CommonConfigSchema>

const HTTPConfigSchema = z
  .object({
    http_url: z.string(),
  })
  .merge(CommonConfigSchema)
export type HTTPConfig = z.infer<typeof HTTPConfigSchema>

const SQLConfigSchema = z
  .object({
    sql_connstring: z.string(),
    sql_queryfile: z.string(),
    sql_format: FormatEnum,
  })
  .merge(CommonConfigSchema)
export type SQLConfig = z.infer<typeof SQLConfigSchema>

const ConfigSchema = z.union([HTTPConfigSchema, SQLConfigSchema])
export type Config = z.infer<typeof ConfigSchema>

export function getConfig(): Config {
  const raw: { [k: string]: string } = {}
  const keys = [
    'outfile_basename',
    'http_url',
    'sql_format',
    'sql_connstring',
    'sql_queryfile',
    'postprocess',
  ]
  keys.forEach(k => {
    const v = core.getInput(k)
    if (v) {
      raw[k] = v
    }
  })
  core.debug(`Raw config: ${JSON.stringify(raw)}`)
  try {
    if ('http_url' in raw) {
      return HTTPConfigSchema.parse(raw)
    } else if ('sql_connstring' in raw) {
      return SQLConfigSchema.parse(raw)
    } else {
      throw new Error(
        'One of `http_url` or `sql_connstring` inputs are required.'
      )
    }
  } catch (error) {
    throw new Error(
      `Invalid configuration!\nReceived: ${JSON.stringify(raw)}\nFailure:${
        error.message
      }`
    )
  }
}

export function isHTTPConfig(config: Config): config is HTTPConfig {
  return 'http_url' in config
}

export function isSQLConfig(config: Config): config is SQLConfig {
  return 'sql_connstring' in config && 'sql_queryfile' in config
}
