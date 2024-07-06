import type { Description } from '@aeriajs/types'

export const crud = <const>{
  actions: {
    'ui:spawnAdd': {
      label: 'action.add',
      icon: 'plus',
      button: true,
      translate: true,
    },
  },
  individualActions: {
    'ui:spawnEdit': {
      label: 'action.edit',
      icon: 'pencil-simple',
      translate: true,
    },
    'route:/dashboard/:collection/:id': {
      label: 'action.view',
      icon: 'eye',
      translate: true,
      setItem: true,
    },
    'remove': {
      label: 'action.remove',
      icon: 'trash',
      ask: true,
      translate: true,
    },
  },
} satisfies Pick<Description, 'actions' | 'individualActions'>
