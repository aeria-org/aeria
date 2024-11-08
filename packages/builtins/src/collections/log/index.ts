import { defineCollection, get, getAll, insert } from '@aeriajs/core'

export const log = defineCollection({
  description: {
    $id: 'log',
    icon: 'magnifying-glass',
    required: [
      'context',
      'message',
    ],
    properties: {
      owner: {
      // don't use "owned: true", we want it this way
        $ref: 'user',
        noForm: true,
      },
      context: {
        type: 'string',
      },
      message: {
        type: 'string',
      },
      details: {
        type: 'object',
        additionalProperties: true,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
      },
    },
    presets: ['view'],
    filters: [
      'context',
      'message',
      'owner',
    ],
  },
  functions: {
    get,
    getAll,
    insert,
  },
  exposedFunctions: {
    get: true,
    getAll: true,
    insert: true,
  },
})
