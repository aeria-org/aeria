import assert from 'assert'
import { safeJson } from '../dist/index.js'

describe('Payload', () => {
  it('removes unsafe properties from JSON payload', async () => {
    const parsed1 = safeJson('{ "constructor": "injected" }')
    const parsed2 = safeJson('{ "__proto__": "injected" }')
    const parsed3 = safeJson('{ "constructor": "injected", "__proto__": "injected" }')

    assert(parsed1.constructor !== 'injected')
    assert(parsed2.__proto__ !== 'injected')
    assert(parsed3.constructor !== 'injected')
    assert(parsed3.__proto__ !== 'injected')
  })

})

