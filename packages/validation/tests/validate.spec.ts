import { expect, test, assert } from 'vitest'
import { ValidationErrorCode, PropertyValidationErrorCode, type Property, type Description } from '@aeriajs/types'
import { validate, validateWithRefs } from '../src/index.js'
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
  expect(plainCandidate).toStrictEqual(result)
})

test('validates object using validator', () => {
  const { result } = personValidator(personCandidate)
  assert(result)
  expect(personCandidate).toStrictEqual(result)
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
  expect(deepCandidate).toStrictEqual(result)
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
  const validEither = validate({ id: 10 }, conditionalDescription)
  const invalidEither = validate({ id: 9 }, conditionalDescription)
  assert(validEither.result)
  assert(invalidEither.error)
})

test('coercion during validation', () => {
  const validEither = validate({
    age: '10',
    weight: '10.5',

  }, coercionDescription, { coerce: true })

  const invalidEither = validate({
    age: '10.8',
    weight: 'ten',
  }, coercionDescription, { coerce: true })

  assert(validEither.result)
  assert(invalidEither.error)
})

test('validates array length', () => {
  const arrayDescription: Description = {
    $id: '',
    properties: {
      jobs: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 1,
      },
    },
  }

  const minItemsEither = validate({ jobs: [] }, arrayDescription)

  const maxItemsEither = validate({
    jobs: [
      'programmer',
      'doctor',
    ],
  }, arrayDescription)

  assert(minItemsEither.error)
  assert('code' in minItemsEither.error && minItemsEither.error.code === ValidationErrorCode.InvalidProperties)
  assert('type' in minItemsEither.error.details.jobs)
  expect(minItemsEither.error.details.jobs.type).toBe(PropertyValidationErrorCode.MoreItemsExpected)

  assert(maxItemsEither.error)
  assert('code' in maxItemsEither.error && maxItemsEither.error.code === ValidationErrorCode.InvalidProperties)
  assert('type' in maxItemsEither.error.details.jobs)
  expect(maxItemsEither.error.details.jobs.type).toBe(PropertyValidationErrorCode.LessItemsExpected)
})

test('validates unstructured object', () => {
  const property: Property = {
    type: 'object',
    additionalProperties: true,
  }

  const { error: error1 } = validate({ prop: 1 }, property)
  const { error: error2 } = validate(null, property)
  const { error: error3 } = validate(undefined, property)

  assert(!error1)
  assert(!error2)
  assert(error3)
})

test('validates unstructured object', () => {
  const property: Property = {
    type: 'object',
    additionalProperties: true,
  }

  const { error: error1 } = validate({ prop: 1 }, property)
  const { error: error2 } = validate(null, property)
  const { error: error3 } = validate(undefined, property)

  assert(!error1)
  assert(!error2)
  assert(error3)
})

test('validateWithRefs() validates deep refs', async () => {
  const property: Property = { $ref: 'pet' }

  const description: Property = {
    type: 'object',
    properties: { pet: { $ref: 'pet' } },
  }

  const petDescription: Description = {
    $id: 'pet',
    properties: {
      name: { type: 'string' },
      breed: { type: 'string' },
    },
  }

  const pet = {
    name: 'thor',
    breed: 'SRD',
  }

  const options = {
    descriptions: {
      pet: petDescription,
    },
  }

  const { error: error1 } = await validateWithRefs(pet, property, options)
  const { error: error2 } = await validateWithRefs({ pet }, description, options)
  const { error: error3 } = await validateWithRefs({ pet: Number() }, description, options)

  assert(!error1)
  assert(!error2)
  assert(error3)
})

