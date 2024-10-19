import type { Description } from '@aeriajs/types'

export const removeAll = ({
  actions: {
    removeAll: {
      label: 'action.removeAll',
      ask: true,
      selection: true,
      translate: true,
    },
  },
} as const) satisfies Pick<Description, 'actions'>
