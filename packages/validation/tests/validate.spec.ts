import assert from 'assert'
import { unwrapEither, isLeft, isRight } from '@aeriajs/common'
import { validate } from '../dist'

import {
  plainCandidate,
  plainDescription,
  conditionalDescription,
  deepCandidate,
  deepDescription,
  personValidator,
  personSilentValidator,
  personCandidate,
  coercionDescription,

} from './fixtures'

describe('Validate', () => {
  it('validates plain object', () => {
    const validationEither = validate(plainCandidate, plainDescription)
    assert(isRight(validationEither))
    assert(JSON.stringify(plainCandidate) === JSON.stringify(unwrapEither(validationEither)))
  })

  it('validates object using validator', () => {
    const validationEither = personValidator(personCandidate)
    assert(isRight(validationEither))
    assert(JSON.stringify(plainCandidate) === JSON.stringify(unwrapEither(validationEither)))
  })

  it('validates object using silent validator', () => {
    const person = personSilentValidator(personCandidate)
    assert(JSON.stringify(plainCandidate) === JSON.stringify(person))
  })

  it('returns left with validator', () => {
    const validationEither = personValidator({
      ...personCandidate,
      age: false,
    })

    assert(isLeft(validationEither))
    const error = unwrapEither(validationEither)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('returns null with silent validator', () => {
    const person = personSilentValidator({
      ...personCandidate,
      age: false,
    })

    assert(person === null)
  })

  it('returns error on plain object', () => {
    const candidate = Object.assign({}, plainCandidate)
    candidate.age = '0' as any

    const validationEither = validate(candidate, plainDescription)

    assert(isLeft(validationEither))
    const error = unwrapEither(validationEither)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('validates deep object', () => {
    const validationEither = validate(deepCandidate, deepDescription)

    assert(isRight(validationEither))
    assert(JSON.stringify(deepCandidate) === JSON.stringify(unwrapEither(validationEither)))
  })

  it('returns error on deep object', () => {
    const candidate = Object.assign({}, deepCandidate)
    deepCandidate.style.color.name.name = 1 as any

    const validationEither = validate(candidate, deepDescription)

    assert(isLeft(validationEither))
    const error = unwrapEither(validationEither)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('conditional required', () => {
    const validEither = validate({
      id: 10,
    }, conditionalDescription)
    const invalidEither = validate({
      id: 9,
    }, conditionalDescription)
    assert(isRight(validEither))
    assert(isLeft(invalidEither))
  })

  it('coercion during validation', () => {
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

    assert(isRight(validEither))
    validEither.value.age === 10
    validEither.value.weight === 10.5

    assert(isLeft(invalidEither))
  })
})

