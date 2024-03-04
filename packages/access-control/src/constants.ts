import type { AccessControl } from '@aeriajs/types'

export const DEFAULT_ACCESS_CONTROL = <const>{
  roles: {
    root: {
      grantEverything: true,
    },
  },
} satisfies AccessControl
