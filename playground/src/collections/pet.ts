import { defineCollection } from 'aeria'

export const pet = defineCollection({
  description: {
    $id: 'pet',
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

