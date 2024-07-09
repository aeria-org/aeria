import type { Description } from '@aeriajs/types'

export const view = <const>{
  individualActions: {
    viewItem: {
      label: 'action.view',
      icon: 'eye',
      translate: true,
      route: {
        name: '/dashboard/:collection/:id',
        setItem: true,
      }
    },
  },
} satisfies Pick<Description, 'individualActions'>
