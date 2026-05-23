import type { Context, GenericRequest, GenericResponse } from '@aeriajs/types'
import { createRouter } from '../../src/index.js'

export const dummyContext = {} as Context
export const dummyResponse = {} as GenericResponse

export const createDummyRequest = (method: string, url: string, headers: Record<string, string> = {}) => {
  return {
    method,
    url,
    headers,
  } as GenericRequest
}

export const router1 = createRouter()
router1.GET('/hello', () => 'got a GET request')
router1.POST('/hello', () => 'got a POST request')

export const router2 = createRouter()
router2.group('/router1', router1)

