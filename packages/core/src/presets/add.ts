import type { Description } from '@aeriajs/types'

export const add = ({
  actions: {
    spawnAdd: {
      label: 'action.add',
      event: 'spawnAdd',
      icon: 'plus',
      button: true,
      translate: true,
    },
  },
} as const) satisfies Pick<Description, 'actions'>

