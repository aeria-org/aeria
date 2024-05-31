import { extendCollection, user as originalUser } from 'aeria'

export const user = extendCollection(originalUser, {
  description: {
    properties: {
      roles: {
        type: 'array',
        items: {
          enum: [
            'customer',
            'manager',
          ],
        },
      },
    },
  },
})
