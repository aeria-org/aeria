import type { Description } from '@aeriajs/types'

export const duplicate = <const>{
  individualActions: {
    'ui:duplicate': {
      label: 'action.duplicate',
      icon: 'copy',
      translate: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
