import type { JsonSchema } from '@aeriajs/types'

export const owned = <const>{
  properties: {
    owner: {
      $ref: 'user',
      noForm: true,
    },
  },
} satisfies Pick<JsonSchema, 'properties'>
