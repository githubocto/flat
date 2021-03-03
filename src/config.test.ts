import { Config, getConfig, HTTPConfig } from './config'
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
