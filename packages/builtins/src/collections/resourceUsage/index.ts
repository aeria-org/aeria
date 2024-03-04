import { defineCollection } from '@aeriajs/api'

export const resourceUsage = defineCollection({
  description: {
    $id: 'resourceUsage',
    required: [],
    properties: {
      hits: {
        type: 'integer',
      },
      last_maximum_reach: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
})
