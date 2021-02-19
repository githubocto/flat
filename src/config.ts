import * as core from '@actions/core'
import * as z from 'zod'

const FormatEnum = z.enum(['csv', 'json'])
export type FormatEnum = z.infer<typeof FormatEnum>

const CommonConfigSchema = z.object({
  outfile: z.string(),
  format: FormatEnum
})
export type CommonConfig = z.infer<typeof CommonConfigSchema>

const HTTPConfigSchema = z.object({
  url: z.string()
}).merge(CommonConfigSchema)
export type HTTPConfig = z.infer<typeof HTTPConfigSchema>

const SQLConfigSchema = z.object({
  connstring: z.string(),
  queryfile: z.string(),
}).merge(CommonConfigSchema)
export type SQLConfig = z.infer<typeof SQLConfigSchema>

const ConfigSchema = z.union([HTTPConfigSchema, SQLConfigSchema])
export type Config = z.infer<typeof ConfigSchema>


export function getConfig(): Config {
  const raw: {[k:string]: string} = {}
  const keys = ['outfile', 'format', 'url', 'connstring', 'queryfile']
  keys.forEach(k => {
    const v = core.getInput(k)
    if (v) {
      raw[k] = v
    }
  });
  core.debug(`Raw config: ${JSON.stringify(raw)}`)
  try {
    if ('url' in raw) {
      return HTTPConfigSchema.parse(raw)
    } else if ('connstring' in raw) {
      return SQLConfigSchema.parse(raw)
    } else {
      throw new Error('One of `url` or `connstring` inputs are required.')
    }
  } catch (error) {
    throw new Error(`Invalid configuration!\nReceived: ${JSON.stringify(raw)}\nFailure:${error.message}`)
  }
}

export function isHTTPConfig(config: Config): config is HTTPConfig {
  return ('url' in config)
}

export function isSQLConfig(config: Config): config is SQLConfig {
  return ('connstring' in config && 'queryfile' in config)
}