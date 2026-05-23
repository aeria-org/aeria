import type { JsonSchema } from '@aeriajs/types'

export const owned = ({
  properties: {
    owner: {
      $ref: 'user',
      noForm: true,
    },
  },
} as const) satisfies Pick<JsonSchema, 'properties'>
