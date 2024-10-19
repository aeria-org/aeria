import type { JsonSchema } from '@aeriajs/types'

export const timestamped = ({
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
} as const) satisfies Pick<JsonSchema, 'properties'>
