import { expect, test, assert } from 'vitest'
import { convertConditionToQuery } from '../src/index.js'

test('convert condition to stateless query', () => {
  const query = convertConditionToQuery({
    and: [
      {
        operator: 'equal',
        term1: 'name',
        term2: 'terry',
      },
      {
        operator: 'gt',
        term1: 'age',
        term2: 18,
      },
    ],
  })

  assert(Array.isArray(query.$and))
  expect(query.$and[0]).toStrictEqual({ name: 'terry' })
  expect(query.$and[1].age).toStrictEqual({ $gt: 18 })
})

test('convert condition to stateful query', () => {
  const query = convertConditionToQuery({
    operator: 'equal',
    term1: 'name',
    term2: 'name2',
    fromState: true,
  }, { name2: 'terry' })

  expect(query).toStrictEqual({ name: 'terry' })
})

