import { expect, test } from 'vitest'
import { freshItem } from '../src/index.js'

test('freshItem() returns correctly', async () => {
  expect(freshItem({
    properties: {
      name: {
        type: 'string',
      },
      pet: {
        $ref: 'pet',
      },
      nested: {
        type: 'object',
        properties: {
          boolean: {
            type: 'boolean',
          },
        },
      },
      array: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  })).toStrictEqual({
    nested: {
      boolean: false,
    },
    array: [],
  })
})


