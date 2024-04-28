import type { Description } from '@aeriajs/types'

export const remove = <const>{
  individualActions: {
    remove: {
      name: 'action.remove',
      icon: 'trash',
      ask: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
