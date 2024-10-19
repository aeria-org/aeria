import { expect, test } from 'vitest'
import { isReference } from '../src/index.js'

test('isReference() returns correctly', async () => {
  expect(isReference({ type: 'string' })).toBeFalsy()
  expect(isReference({ $ref: 'person' })).toBeTruthy()
  expect(isReference({
    type: 'array',
    items: { type: 'string' },
  })).toBeFalsy()
  expect(isReference({
    type: 'array',
    items: { $ref: 'person' },
  })).toBeTruthy()
})

