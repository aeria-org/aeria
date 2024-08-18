import assert from 'assert'
import { expect, test } from 'vitest'
import { validate } from '../dist/index.js'

import {
  plainCandidate,
  plainDescription,
  conditionalDescription,
  deepCandidate,
  deepDescription,
  personValidator,
  personCandidate,
  coercionDescription,

} from './fixtures'

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
  assert('code' in error && error.code === 'INVALID_PROPERTIES')
})

test('returns error on plain object', () => {
  const candidate = Object.assign({}, plainCandidate)
  candidate.age = '0' as any

  const { error } = validate(candidate, plainDescription)

  assert(error)
  assert('code' in error && error.code === 'INVALID_PROPERTIES')
})

test('returns error on divergent const', () => {
  const candidate = Object.assign({}, plainCandidate)
  candidate.job = 'invalid'

  const { error } = validate(candidate, plainDescription)

  assert(error)
  assert('code' in error && error.code === 'INVALID_PROPERTIES')
})

test('validates deep object', () => {
  const { result } = validate(deepCandidate, deepDescription)

  assert(result)
  expect(JSON.stringify(deepCandidate)).toBe(JSON.stringify(result))
})

test('returns error on deep object', () => {
  const candidate = Object.assign({}, deepCandidate)
  deepCandidate.style.color.props.name = 1 as any

  const { error } = validate(candidate, deepDescription)

  assert(error)
  assert('code' in error && error.code === 'INVALID_PROPERTIES')
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

