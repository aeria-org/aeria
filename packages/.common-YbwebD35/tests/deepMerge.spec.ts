import { expect, test } from 'vitest'
import { deepMerge } from '../src/index.js'

test('deepMerge() merges objects correctly', async () => {
  expect(deepMerge({
    a: 1,
    b: 'old',
  }, {
    b: 2,
    c: { d: 3 },
  })).toStrictEqual({
    a: 1,
    b: 2,
    c: { d: 3 },
  })
})

