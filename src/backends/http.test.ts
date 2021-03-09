import { AxiosResponse } from 'axios'
import { HTTPConfig } from '../config'
import fetchHTTP, { determineFilename } from './http'
import * as core from '@actions/core'
import axios from 'axios'
import fs from 'fs'
import { PassThrough } from 'stream'

jest.mock('@actions/core')
jest.mock('axios')
jest.mock('fs')

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

it('fetches data over HTTP', async () => {
  const config = {
    outfile_basename: 'data',
    http_url: 'https://foo.bar',
  }

  const mockWritable = new PassThrough()
  const mockReadable = new PassThrough()
  const response = {
    headers: {
      'content-disposition': 'attachment; filename="lala.txt"',
      'content-type': 'text/plain; charset=UTF-8',
    },
    data: mockReadable,
  }
  //@ts-ignore
  axios.get.mockResolvedValue(response)
  //@ts-ignore
  fs.createWriteStream.mockReturnValueOnce(mockWritable)
  mockWritable.end()

  expect(await fetchHTTP(config)).toBeUndefined()
})

it('throws an error if HTTP request fails', async () => {
  const config = {
    outfile_basename: 'data',
    http_url: 'https://foo.bar',
  }

  const err = new Error('oh snap')
  //@ts-ignore
  axios.get.mockRejectedValue(err)

  await expect(fetchHTTP(config)).rejects.toEqual(err)
})
