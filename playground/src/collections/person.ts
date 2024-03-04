import { defineCollection, get, getAll, insert } from 'aeria'

export const person = defineCollection({
  description: {
    $id: 'person',
    properties: {
      name: {
        type: 'string',
      },
      job: {
        enum: [
          'driver',
          'baker',
          'programmer',
          'policeman',
        ],
      },
      pets: {
        type: 'array',
        items: {
          $ref: 'pet',
        },
      },
    },
  },
  functions: {
    get,
    getAll,
    insert,
  },
  accessControl: {
    roles: {
      root: {
        grantEverything: true,
      },
      guest: {
        inherit: ['root'],
        grant: ['getAll'],
      },
    },
  },
})

