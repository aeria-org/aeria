import type { JsonSchema } from '@aeriajs/types'
import { expect, test } from 'vitest'
import { getMissingProperties } from '../src/index.js'

test('getMissingProperties() returns correctly', async () => {
  const schema: JsonSchema = {
    $id: 'person',
    properties: {
      name: {
        type: 'string',
      },
    },
  }

  expect(getMissingProperties({}, schema, [])).toHaveLength(0)
  expect(getMissingProperties({}, schema, ['name'])).toHaveLength(1)
  expect(getMissingProperties({ name: 'terry', }, schema, ['name'])).toHaveLength(0)
})

