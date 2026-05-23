import type { Description } from '@aeriajs/types'

export const view = ({
  individualActions: {
    viewItem: {
      label: 'action.view',
      icon: 'eye',
      translate: true,
      route: {
        name: '/dashboard/:collection/:id',
        setItem: true,
      },
    },
  },
} as const) satisfies Pick<Description, 'individualActions'>
