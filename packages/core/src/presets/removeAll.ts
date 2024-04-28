import type { Description } from '@aeriajs/types'

export const removeAll = <const>{
  actions: {
    removeAll: {
      name: 'action.removeAll',
      ask: true,
      selection: true,
      translate: true,
    },
  },
} satisfies Pick<Description, 'actions'>
