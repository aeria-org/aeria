import type { Description } from '@aeriajs/types'

export const duplicate = <const>{
  individualActions: {
    duplicate: {
      label: 'action.duplicate',
      event: 'duplicate',
      icon: 'copy',
      translate: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
