import { expect, test } from 'vitest'
import { checkForEmptiness } from '../src/index.js'

test('checkForEmptiness() returns correctly', async () => {
  expect(checkForEmptiness({ name: '' }, { type: 'string' }, 'name')).toBeTruthy()
  expect(checkForEmptiness({ name: null }, { type: 'string' }, 'name')).toBeTruthy()
  expect(checkForEmptiness({ name: undefined }, { type: 'string' }, 'name')).toBeTruthy()

  expect(checkForEmptiness({}, {
    type: 'string',
    format: 'date-time',
    isTimestamp: true,
  }, 'created_at')).toBeFalsy()
  expect(checkForEmptiness({}, {
    type: 'string',
    readOnly: true,
  }, 'name')).toBeFalsy()

  expect(checkForEmptiness({ name: 'terry' }, { type: 'string' }, 'name')).toBeFalsy()
  expect(checkForEmptiness({}, { type: 'boolean' }, 'active')).toBeTruthy()
  expect(checkForEmptiness({ active: false }, { type: 'boolean' }, 'active')).toBeFalsy()
})

