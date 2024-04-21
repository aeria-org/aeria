import { init, createRouter, isLeft, unwrapEither, leftSchema } from 'aeria'
export * as collections from './collections'

const router = createRouter({
  exhaust: true,
})

router.GET('/get-people', async (context) => {
  const personEither = await context.collections.person.functions.insert({
    what: {
      name: context.request.payload.name,
      job: 'programmer',
      pets: [],
    },
  })

  if( isLeft(personEither) ) {
    return personEither
  }

  const person = unwrapEither(personEither)
  person.name
  person.job

  if( person.pets ) {
    for( const pet of person.pets ) {
      pet.name
      pet.toys.favorite.name
      pet.toys.favorite.brand
      // @ts-expect-error
      pet.toys.favorite.invalid
    }
  }

  return context.collections.person.functions.getAll()
}, {
  payload: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
    },
  },
  response: [
    leftSchema({
      type: 'object',
      variable: true,
    }),
    {
      type: 'array',
      items: {
        $ref: 'person',
      },
    },
  ],
})

export default init({
  callback: (context) => {
    return router.install(context)
  },
})
