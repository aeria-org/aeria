import type { Property } from '@aeriajs/types'

export const coercionDescription = {
  type: 'object',
  properties: {
    age: {
      type: 'integer',
    },
    weight: {
      type: 'number',
    },
  },
} satisfies Property
