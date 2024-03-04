import type { Description } from '@aeriajs/types'

export const view = <const>{
  individualActions: {
    'ui:spawnView': {
      name: 'action.view',
      icon: 'magnifying-glass-plus',
      translate: true,
    },
  },
} satisfies Pick<Description, 'individualActions'>
