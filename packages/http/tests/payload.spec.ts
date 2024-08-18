import { expect, test } from 'vitest'
import { safeJson } from '../dist/index.js'

test('removes unsafe properties from JSON payload', async () => {
  const parsed1 = safeJson('{ "constructor": "injected" }')
  const parsed2 = safeJson('{ "__proto__": "injected" }')
  const parsed3 = safeJson('{ "constructor": "injected", "__proto__": "injected" }')

  expect(parsed1.constructor).not.toBe('injected')
  expect(parsed2.__proto__).not.toBe('injected')
  expect(parsed3.constructor).not.toBe('injected')
  expect(parsed3.__proto__).not.toBe('injected')
})

