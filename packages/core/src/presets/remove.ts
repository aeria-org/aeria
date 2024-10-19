import type { Description } from '@aeriajs/types'

export const remove = ({
  individualActions: {
    remove: {
      label: 'action.remove',
      icon: 'trash',
      ask: true,
      translate: true,
    },
  },
} as const) satisfies Pick<Description, 'individualActions'>
