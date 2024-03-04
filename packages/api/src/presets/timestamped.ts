import type { JsonSchema } from '@aeriajs/types'

export const timestamped = <const>{
  properties: {
    created_at: {
      type: 'string',
      format: 'date-time',
      noForm: true,
      readOnly: true,
      isTimestamp: true,
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      noForm: true,
      readOnly: true,
      isTimestamp: true,
    },
  },
} satisfies Pick<JsonSchema, 'properties'>
