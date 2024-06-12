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
    const { result } = validate(plainCandidate, plainDescription)
    assert(result)
    assert(JSON.stringify(plainCandidate) === JSON.stringify(result))
  })

  it('validates object using validator', () => {
    const { result } = personValidator(personCandidate)
    assert(result)
    assert(JSON.stringify(personCandidate) === JSON.stringify(result))
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
    const { result } = validate(deepCandidate, deepDescription)

    assert(result)
    assert(JSON.stringify(deepCandidate) === JSON.stringify(result))
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
    assert(validEither.result)
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

    assert(validEither.result)
    validEither.result.age === 10
    validEither.result.weight === 10.5

    assert(invalidEither.error)
  })
})

