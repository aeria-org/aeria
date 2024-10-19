import type { Description } from '@aeriajs/types'

export const deepCandidate = {
  status: [
    {
      user_id: 'test',
      status: 'running',
    },
    {
      user_id: 'test',
      status: 'pending',
    },
  ],
  style: { color: { props: { name: 'red' } } },
}

export const deepDescription = {
  properties: {
    status: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          status: {
            enum: [
              'running',
              'pending',
            ],
          },
        },
      },
    },
    style: {
      type: 'object',
      properties: {
        color: {
          type: 'object',
          properties: {
            props: {
              type: 'object',
              properties: { name: { type: 'string' } },
            },
          },
        },
      },
    },
  },
} satisfies Omit<Description, '$id'>

