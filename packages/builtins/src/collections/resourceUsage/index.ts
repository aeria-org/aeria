import { defineCollection } from '@aeriajs/core'

export const resourceUsage = defineCollection({
  description: {
    $id: 'resourceUsage',
    icon: 'wrench',
    required: ['usage'],
    properties: {
      user: {
        $ref: 'user',
      },
      address: {
        type: 'string',
      },
      usage: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            hits: {
              type: 'integer',
            },
            points: {
              type: 'integer',
            },
            last_reach: {
              type: 'string',
              format: 'date-time',
            },
            last_maximum_reach: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  },
})

