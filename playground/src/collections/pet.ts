import { defineCollection } from 'aeria'

export const pet = defineCollection({
  description: {
    $id: 'pet',
    indexes: [
      'name'
    ],
    properties: {
      name: {
        type: 'string',
      },
      toys: {
        type: 'object',
        properties: {
          favorite: {
            $ref: 'petToy',
          },
        },
      },
    },
  },
})

export const petToy = defineCollection({
  description: {
    $id: 'petToy',
    indexes: [
      'name'
    ],
    properties: {
      name: {
        type: 'string',
      },
      brand: {
        enum: [
          'dogs choice',
          'the pet company',
        ],
      },
    },
  },
})

