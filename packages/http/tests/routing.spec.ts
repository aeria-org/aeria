import type { GenericRequest } from '@aeriajs/types'
import assert from 'assert'
import { matches } from '../dist'

describe('Routing', () => {
  it('matches patterns correctly', async () => {
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

    assert(shouldMatch1)
    assert(shouldMatch2)
    assert(shouldMatch3)
    assert(!shouldntMatch1)
    assert(!shouldntMatch2)
    assert(!shouldntMatch3)
    assert(!shouldntMatch4)
  })

  it('matches patterns with fragments correctly', async () => {
    const req: Partial<GenericRequest> = {
      url: '/resource/123/view',
      method: 'GET',
    }

    const shouldMatch1 = matches(req as GenericRequest, 'GET', '/resource/([0-9]+)/view')
    const shouldMatch2 = matches({ ...req, url: '/resource/123/view?query=val' } as GenericRequest, 'GET', '/resource/([0-9]+)/view')
    const shouldntMatch1 = matches(req as GenericRequest, 'GET', '/resource/abc/view')
    const shouldntMatch2 = matches(req as GenericRequest, 'GET', '/resource/abc/invalid')

    assert(shouldMatch1)
    assert(shouldMatch1.fragments[0] === '123')
    assert(shouldMatch2)
    assert(shouldMatch2.fragments[0] === '123')
    assert(!shouldntMatch1)
    assert(!shouldntMatch2)
  })

})

