import type { RequiredProperties, JsonSchema } from '@aeriajs/types'
import { expect, test } from 'vitest'
import { isRequired } from '../src/index.js'

test('isRequired() returns correctly with array', async () => {
  const requiredArray: RequiredProperties<JsonSchema> = ['name']

  expect(isRequired('name', requiredArray, {})).toBeTruthy()
  expect(isRequired('job', requiredArray, {})).toBeFalsy()
})

test('isRequired() returns correctly with object', async () => {
  const requiredKeyValue: RequiredProperties<JsonSchema> = {
    name: true,
    job: false,
  }

  expect(isRequired('name', requiredKeyValue, {})).toBeTruthy()
  expect(isRequired('job', requiredKeyValue, {})).toBeFalsy()
  expect(isRequired('age', requiredKeyValue, {})).toBeFalsy()
})

test('isRequired() returns correctly with condition', async () => {
  const requiredCondition: RequiredProperties<JsonSchema> = {
    responsible: {
      operator: 'lt',
      term1: 'age',
      term2: 18,
    },
  }

  expect(isRequired('responsible', requiredCondition, { age: 17 })).toBeTruthy()
  expect(isRequired('responsible', requiredCondition, { age: 18 })).toBeFalsy()
})

