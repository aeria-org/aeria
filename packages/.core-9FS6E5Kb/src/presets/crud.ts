import type { Description } from '@aeriajs/types'

export const crud = ({
  actions: {
    spawnAdd: {
      label: 'action.add',
      event: 'spawnAdd',
      icon: 'plus',
      button: true,
      translate: true,
    },
  },
  individualActions: {
    spawnEdit: {
      label: 'action.edit',
      event: 'spawnEdit',
      icon: 'pencil-simple',
      translate: true,
    },
    viewItem: {
      label: 'action.view',
      icon: 'eye',
      translate: true,
      route: {
        name: '/dashboard/:collection/:id',
        setItem: true,
      },
    },
    remove: {
      label: 'action.remove',
      icon: 'trash',
      ask: true,
      translate: true,
    },
  },
} as const) satisfies Pick<Description, 'actions' | 'individualActions'>
