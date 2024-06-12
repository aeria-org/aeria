import { init, createRouter, insertErrorSchema, ACError } from 'aeria'
export * as collections from './collections/index.js'

const router = createRouter()

router.GET('/hello-world', () => {
  return {
    message: 'Hello, world',
  }
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
    return error
  }

  person.name
  person.job

  for( const pet of person.pets ) {
    pet.name
    pet.toys.favorite.name
    pet.toys.favorite.brand
    // @ts-expect-error
    pet.toys.favorite.invalid
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
    insertErrorSchema(),
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

