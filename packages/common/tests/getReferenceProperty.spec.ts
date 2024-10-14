import { expect, test } from 'vitest'
import { getReferenceProperty } from '../src/index.js'

test('getReferenceProperty() returns correctly', async () => {
  expect(getReferenceProperty({ type: 'string', })).toBeNull()
  expect(getReferenceProperty({ $ref: 'person', })).toStrictEqual({ $ref: 'person', })
  expect(getReferenceProperty({ type: 'array', items: { $ref: 'person', } })).toStrictEqual({ $ref: 'person', })
})

