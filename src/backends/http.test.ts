import { AxiosResponse } from 'axios'
import { HTTPConfig } from '../config'
import { determineFilename } from './http'
import * as core from '@actions/core'

jest.mock('@actions/core')


test('uses filename from content-disposition', () => {
  const response = {
    headers: {
      'content-disposition': 'attachment; filename="filename.jpg"',
      'content-type': 'text/html; charset=UTF-8',
    },
  }
  const config = {
    outfile_basename: 'data',
  }
  expect(
    determineFilename(response as AxiosResponse, config as HTTPConfig)
  ).toEqual('filename.jpg')
})

test('uses filename* from content-disposition', () => {
  const response = {
    headers: {
      'content-disposition':
        'attachment; filename="filename.jpg"; filename*=UTF-8\'\'f%C3%AEl%E2%82%ACname.jpg',
      'content-type': 'text/html; charset=UTF-8',
    },
  }
  const config = {
    outfile_basename: 'data',
  }
  expect(
    determineFilename(response as AxiosResponse, config as HTTPConfig)
  ).toEqual('fîl€name.jpg')
})

test('uses content-type if content-disposition is not supplied', () => {
  const response = {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
    },
  }
  const config = {
    outfile_basename: 'data',
  }
  expect(
    determineFilename(response as AxiosResponse, config as HTTPConfig)
  ).toEqual('data.html')
})

test('ignores content-type if it is unrecognized', () => {
  const response = {
    headers: {
      'content-type': 'foo/bar',
    },
  }
  const config = {
    outfile_basename: 'data',
  }
  expect(
    determineFilename(response as AxiosResponse, config as HTTPConfig)
  ).toEqual('data')
})

test('Uses outfile_basename when neither content-type or content-disposition is available', () => {
  const response = {
    headers: {},
  }
  const config = {
    outfile_basename: 'data',
  }
  const coreMock = jest.spyOn(core, 'warning')
  expect(
    determineFilename(response as AxiosResponse, config as HTTPConfig)
  ).toEqual('data')
  expect(coreMock).toBeCalledTimes(1)
})




