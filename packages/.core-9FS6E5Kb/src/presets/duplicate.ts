import type { Description } from '@aeriajs/types'

export const duplicate = ({
  individualActions: {
    duplicate: {
      label: 'action.duplicate',
      event: 'duplicate',
      icon: 'copy',
      translate: true,
    },
  },
} as const) satisfies Pick<Description, 'individualActions'>
