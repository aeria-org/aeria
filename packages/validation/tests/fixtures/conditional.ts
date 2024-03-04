import type { Description } from '@aeriajs/types'

export const conditionalDescription = {
  required: {
    id: true,
    name: {
      and: [
        {
          operator: 'gt',
          term1: 'id',
          term2: 0,
        },
        {
          operator: 'lt',
          term1: 'id',
          term2: 10,
        },
      ],
    },
  },
  properties: {
    id: {
      type: 'number',
    },
    name: {
      type: 'string',
    },
  },
} satisfies Omit<Description, '$id'> 

