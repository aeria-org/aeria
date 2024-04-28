import type { Description } from '@aeriajs/types'

export const duplicate = <const>{
  individualActions: {
    'ui:duplicate': {
      name: 'action.duplicate',
      icon: 'copy',
    },
  },
} satisfies Pick<Description, 'individualActions'>
