import {
  Config,
  getConfig,
  HTTPConfig,
  isHTTPConfig,
  isSQLConfig,
} from './config'
import * as core from '@actions/core'
jest.mock('@actions/core')

it('returns an HTTP config', () => {
  const config = {
    http_url: 'https://google.com',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig()).toEqual({
    http_url: 'https://google.com',
    outfile_basename: 'data',
  })
})

it('returns a SQL config', () => {
  const config = {
    sql_connstring: 'SECRETDATAHERE',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig()).toEqual({
    sql_connstring: 'SECRETDATAHERE',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  })
})

it('throws an error for a faulty HTTP config', () => {
  const config = {
    http_url: 'https://google.com',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig).toThrowError(/^Invalid configuration!/)
})

it('throws an error for a faulty SQL config', () => {
  const config = {
    sql_connstring: 'SECRETDATAHERE',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig).toThrowError(/^Invalid configuration!/)
})

it('throws an error if neither HTTP nor SQL is configured', () => {
  const config = {
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig).toThrowError(
    'One of `http_url` or `sql_connstring` inputs are required.'
  )
})

it('prefers HTTP configs', () => {
  const config = {
    http_url: 'https://google.com',
    sql_connstring: 'SECRETDATAHERE',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig()).toEqual({
    http_url: 'https://google.com',
    outfile_basename: 'data',
  })
})

it('accepts a postprocess string', () => {
  const config = {
    http_url: 'https://google.com',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
    postprocess: 'path/to/script.ts',
  }
  const coreMock = jest.spyOn(core, 'getInput')
  // @ts-ignore
  coreMock.mockImplementation(k => config[k])
  expect(getConfig()).toEqual({
    http_url: config.http_url,
    outfile_basename: config.outfile_basename,
    postprocess: config.postprocess,
  })
})

it('correctly identifies configs', () => {
  const http: Config = {
    http_url: 'https://google.com',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
    postprocess: 'path/to/script.ts',
  }
  const sql: Config = {
    sql_connstring: 'SECRETDATAHERE',
    outfile_basename: 'data',
    sql_queryfile: 'query.sql',
    sql_format: 'json',
  }
  expect(isHTTPConfig(http)).toEqual(true)
  expect(isHTTPConfig(sql)).toEqual(false)
  expect(isSQLConfig(sql)).toEqual(true)
  expect(isSQLConfig(http)).toEqual(false)
})
