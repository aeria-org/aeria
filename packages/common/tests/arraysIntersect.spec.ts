import { expect, test } from 'vitest'
import { arraysIntersect } from '../src/index.js'

test('arraysIntersect() returns correctly', async () => {
  expect(arraysIntersect([
    1,
    2,
  ], [
    3,
    4,
  ])).toBeFalsy()
  expect(arraysIntersect([
    1,
    2,
  ], [
    3,
    4,
    2,
  ])).toBeTruthy()
})

