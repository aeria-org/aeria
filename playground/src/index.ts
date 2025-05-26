import { init, createRouter, resultSchema, functionSchemas, ACError, Result, unpaginatedGetAll } from 'aeria'
export * as collections from './collections.js'
import { contracts } from '../.aeria/out/index.js'

const router = createRouter()

router.GET('/hello-world', async (context) => {
  const result = await context.collections.person.functions.hello({
    name: 'Terry',
  })

  // @ts-expect-error
  result.invalid
  return result
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
    // @ts-expect-error
    pet.toys.favorite.invalid
  }

  const { error: getAllError, result: people } = await unpaginatedGetAll({}, await context.collections.person.context())

  if( getAllError ) {
    return Result.error(getAllError)
  }

  return Result.result({
    data: people,
  })
}, contracts.GetPeople)

export default init({
  router,
})

