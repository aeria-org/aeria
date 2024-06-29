import type { Description } from '@aeriajs/types'

export const view = <const>{
  individualActions: {
    'route:/dashboard/crud/:id': {
      label: 'action.view',
      icon: 'eye',
      translate: true,
      setItem: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
