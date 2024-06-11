import assert from 'assert'
import { validate } from '../dist'

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

describe('Validate', () => {
  it('validates plain object', () => {
    const { value } = validate(plainCandidate, plainDescription)
    assert(value)
    assert(JSON.stringify(plainCandidate) === JSON.stringify(value))
  })

  it('validates object using validator', () => {
    const { value } = personValidator(personCandidate)
    assert(value)
    assert(JSON.stringify(personCandidate) === JSON.stringify(value))
  })

  it('returns left with validator', () => {
    const { error } = personValidator({
      ...personCandidate,
      age: false,
    })

    assert(error)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('returns error on plain object', () => {
    const candidate = Object.assign({}, plainCandidate)
    candidate.age = '0' as any

    const { error } = validate(candidate, plainDescription)

    assert(error)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('returns error on divergent const', () => {
    const candidate = Object.assign({}, plainCandidate)
    candidate.job = 'invalid'

    const { error } = validate(candidate, plainDescription)

    assert(error)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('validates deep object', () => {
    const { value } = validate(deepCandidate, deepDescription)

    assert(value)
    assert(JSON.stringify(deepCandidate) === JSON.stringify(value))
  })

  it('returns error on deep object', () => {
    const candidate = Object.assign({}, deepCandidate)
    deepCandidate.style.color.props.name = 1 as any

    const { error } = validate(candidate, deepDescription)

    assert(error)
    assert('code' in error && error.code === 'INVALID_PROPERTIES')
  })

  it('conditional required', () => {
    const validEither = validate({
      id: 10,
    }, conditionalDescription)
    const invalidEither = validate({
      id: 9,
    }, conditionalDescription)
    assert(validEither.value)
    assert(invalidEither.error)
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

    assert(validEither.value)
    validEither.value.age === 10
    validEither.value.weight === 10.5

    assert(invalidEither.error)
  })
})

