import { init, createRouter, resultSchema, functionSchemas, ACError, Result } from 'aeria'
export * as collections from './collections/index.js'

const router = createRouter()

router.GET('/hello-world', (context) => {
  return context.collections.person.functions.hello({
    name: 'Terry',
  })
}, {
  roles: [
    'root',
    'manager',
    'customer',
  ],
})

router.GET('/get-people', async (context) => {
  const { error, result: person } = await context.collections.person.functions.insert({
    what: {
      name: context.request.payload.name,
      job: 'programmer',
      pets: [],
    },
  })

  if( error ) {
    ACError.InsecureOperator satisfies typeof error.code
    // @ts-expect-error
    'invalid' satisfies typeof error.code
    return Result.error(error)
  }

  for( const pet of person.pets ) {
    pet.name
    pet.toys.favorite.name
    pet.toys.favorite.brand
    pet.toys.favorite.invalid
  }

  return Result.result(context.collections.person.functions.getAll())
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
    functionSchemas.insertError(),
    resultSchema({
      type: 'array',
      items: {
        $ref: 'person',
      },
    }),
  ],
})

export default init({
  router,
})

