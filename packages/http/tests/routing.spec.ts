import type { GenericRequest } from '@aeriajs/types'
import { expect, test, assert } from 'vitest'
import { matches } from '../src/index.js'

test('matches patterns correctly', async () => {
  const req: Partial<GenericRequest> = {
    url: '/test1',
    method: 'GET',
  }

  const shouldMatch1 = matches(req as GenericRequest, 'GET', '/test1')
  const shouldMatch2 = matches({ ...req, url: '/api/test1' } as GenericRequest, 'GET', '/test1', { base: '/api' })
  const shouldMatch3 = matches({ ...req, url: '/test1?query=val' } as GenericRequest, 'GET', '/test1')
  const shouldntMatch1 = matches(req as GenericRequest, 'POST', '/test1')
  const shouldntMatch2 = matches(req as GenericRequest, 'GET', '/test1', { base: '/api' })
  const shouldntMatch3 = matches(req as GenericRequest, 'GET', '/test12')
  const shouldntMatch4 = matches(req as GenericRequest, 'GET', '/test')

  expect(shouldMatch1).toBeTruthy()
  expect(shouldMatch2).toBeTruthy()
  expect(shouldMatch3).toBeTruthy()
  expect(shouldntMatch1).toBeFalsy()
  expect(shouldntMatch2).toBeFalsy()
  expect(shouldntMatch3).toBeFalsy()
  expect(shouldntMatch4).toBeFalsy()
})

test('matches patterns with fragments correctly', async () => {
  const req: Partial<GenericRequest> = {
    url: '/resource/123/view',
    method: 'GET',
  }

  const shouldMatch1 = matches(req as GenericRequest, 'GET', '/resource/([0-9]+)/view')
  const shouldMatch2 = matches({ ...req, url: '/resource/123/view?query=val' } as GenericRequest, 'GET', '/resource/([0-9]+)/view')
  const shouldntMatch1 = matches(req as GenericRequest, 'GET', '/resource/abc/view')
  const shouldntMatch2 = matches(req as GenericRequest, 'GET', '/resource/123/invalid')

  assert(shouldMatch1)
  expect(shouldMatch1.fragments[0]).toBe('123')
  assert(shouldMatch2)
  expect(shouldMatch2.fragments[0]).toBe('123')
  expect(shouldntMatch1).toBeFalsy()
  expect(shouldntMatch2).toBeFalsy()
})

