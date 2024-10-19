import { expect, test } from 'vitest'
import { checkForEmptiness } from '../src/index.js'

test('checkForEmptiness() returns correctly', async () => {
  expect(checkForEmptiness({ type: 'string' }, 'name', { name: '' })).toBeTruthy()
  expect(checkForEmptiness({ type: 'string' }, 'name', { name: null })).toBeTruthy()
  expect(checkForEmptiness({ type: 'string' }, 'name', { name: undefined })).toBeTruthy()

  expect(checkForEmptiness({
    type: 'string',
    format: 'date-time',
    isTimestamp: true,
  }, 'created_at', {})).toBeFalsy()
  expect(checkForEmptiness({
    type: 'string',
    readOnly: true,
  }, 'name', {})).toBeFalsy()

  expect(checkForEmptiness({ type: 'string' }, 'name', { name: 'terry' })).toBeFalsy()
  expect(checkForEmptiness({ type: 'boolean' }, 'active', {})).toBeTruthy()
  expect(checkForEmptiness({ type: 'boolean' }, 'active', { active: false })).toBeFalsy()
})

