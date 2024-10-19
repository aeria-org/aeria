import { expect, test, assert } from 'vitest'
import { ValidationErrorCode, PropertyValidationErrorCode, type JsonSchema } from '@aeriajs/types'
import { validate } from '../src/index.js'
import {
  plainCandidate,
  plainDescription,
  conditionalDescription,
  deepCandidate,
  deepDescription,
  personValidator,
  personCandidate,
  coercionDescription,

} from './fixtures/index.js'

test('validates plain object', () => {
  const { result } = validate(plainCandidate, plainDescription)
  assert(result)
  expect(JSON.stringify(plainCandidate)).toBe(JSON.stringify(result))
})

test('validates object using validator', () => {
  const { result } = personValidator(personCandidate)
  assert(result)
  expect(JSON.stringify(personCandidate)).toBe(JSON.stringify(result))
})

test('returns left with validator', () => {
  const { error } = personValidator({
    ...personCandidate,
    age: false,
  })

  assert(error)
  assert('code' in error && error.code === ValidationErrorCode.InvalidProperties)
})

test('returns error on plain object', () => {
  const candidate = Object.assign({}, plainCandidate)
  // @ts-expect-error
  candidate.age = '0'

  const { error } = validate(candidate, plainDescription)

  assert(error)
  assert('code' in error && error.code === ValidationErrorCode.InvalidProperties)
})

test('returns error on divergent const', () => {
  const candidate = Object.assign({}, plainCandidate)
  candidate.job = 'invalid'

  const { error } = validate(candidate, plainDescription)

  assert(error)
  assert('code' in error && error.code === ValidationErrorCode.InvalidProperties)
})

test('validates deep object', () => {
  const { result } = validate(deepCandidate, deepDescription)

  const { error: missingPropertiesError } = validate({
    status: [],
    style: {},
  }, deepDescription)

  assert(result)
  assert(missingPropertiesError)
  expect(JSON.stringify(deepCandidate)).toBe(JSON.stringify(result))
})

test('returns error on deep object', () => {
  const candidate = Object.assign({}, deepCandidate)
  // @ts-expect-error
  deepCandidate.style.color.props.name = 1

  const { error } = validate(candidate, deepDescription)

  assert(error)
  assert('code' in error && error.code === ValidationErrorCode.InvalidProperties)
})

test('conditional required', () => {
  const validEither = validate({
    id: 10,
  }, conditionalDescription)
  const invalidEither = validate({
    id: 9,
  }, conditionalDescription)
  assert(validEither.result)
  assert(invalidEither.error)
})

test('coercion during validation', () => {
  const validEither = validate({
    age: '10',
    weight: '10.5',

  }, coercionDescription, {
    coerce: true,
  })

  const invalidEither = validate({
    age: '10.8',
    weight: 'ten',
  }, coercionDescription, {
    coerce: true,
  })

  assert(validEither.result)
  assert(invalidEither.error)
})

test('validates array length', () => {
  const arrayDescription: Omit<JsonSchema, '$id'> = {
    properties: {
      jobs: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
        maxItems: 1,
      },
    },
  }

  const minItemsEither = validate({
    jobs: []
  }, arrayDescription)

  const maxItemsEither = validate({
    jobs: [
      'programmer',
      'doctor',
    ]
  }, arrayDescription)


  assert(minItemsEither.error)
  assert('code' in minItemsEither.error && minItemsEither.error.code === ValidationErrorCode.InvalidProperties)
  assert('type' in minItemsEither.error.errors.jobs)
  expect(minItemsEither.error.errors.jobs.type).toBe(PropertyValidationErrorCode.MoreItemsExpected)

  assert(maxItemsEither.error)
  assert('code' in maxItemsEither.error && maxItemsEither.error.code === ValidationErrorCode.InvalidProperties)
  assert('type' in maxItemsEither.error.errors.jobs)
  expect(maxItemsEither.error.errors.jobs.type).toBe(PropertyValidationErrorCode.LessItemsExpected)
})

