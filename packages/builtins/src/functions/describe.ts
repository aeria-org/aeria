import type { Description, Context, RouteContext, StringProperty, EnumProperty } from '@aeriajs/types'
import type { description as userDescription } from '../collections/user/description.js'
import { createContext, preloadDescription, getEndpoints } from '@aeriajs/core'
import { getCollections, getAvailableRoles } from '@aeriajs/entrypoint'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import { serialize, endpointError, isValidCollection } from '@aeriajs/common'
import { validator } from '@aeriajs/validation'
import { authenticate } from '../collections/user/authenticate.js'

const [Payload, validatePayload] = validator({
  type: 'object',
  required: [],
  additionalProperties: true,
  properties: {
    collections: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    noSerialize: {
      type: 'boolean',
    },
    revalidate: {
      type: 'boolean',
    },
    roles: {
      type: 'boolean',
    },
    router: {
      type: 'boolean',
    },
  },
})

export const describe = async (contextOrPayload: RouteContext | typeof Payload) => {
  const result = {} as {
    descriptions: typeof descriptions
    roles?: string[]
    auth?: Awaited<ReturnType<typeof authenticate>> extends Result.Either<unknown, infer Right>
      ? Partial<Right>
      : never
    router?: unknown
  }

  let props: typeof Payload
  if( 'request' in contextOrPayload ) {
    const { error, result: validatedPayload } = validatePayload(contextOrPayload.request.payload)
    if( error ) {
      return endpointError({
        httpStatus: HTTPStatus.UnprocessableContent,
        code: ACError.MalformedInput,
        details: error,
      })
    }

    props = validatedPayload
  } else {
    props = contextOrPayload
  }
  if( 'request' in contextOrPayload && props.revalidate ) {
    const { error, result: auth } = await authenticate({
      revalidate: true,
    }, (await createContext({
      collectionName: 'user',
      parentContext: contextOrPayload,
    }) as Context<typeof userDescription>))

    if( error ) {
      return Result.error(error)
    }

    result.auth = JSON.parse(JSON.stringify(auth))
  }

  const collections = await getCollections()

  const retrievedCollections = props.collections?.length
    ? Object.fromEntries(Object.entries(collections).filter(([key]) => props.collections!.includes(key)))
    : collections

  const descriptions: Record<string, Description> = {}
  result.descriptions = descriptions

  for( const collectionName in retrievedCollections ) {
    const candidate = retrievedCollections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    if( !isValidCollection(collection) ) {
      throw new Error(`The "${collectionName}" symbol exported from the entrypoint doesn't seem like a valid collection. Make sure only collections are exported from the "import('.').collections".`)
    }

    const { description: rawDescription } = collection

    const description = await preloadDescription(rawDescription)
    descriptions[description.$id] = description
  }

  if( props.roles ) {
    const userCandidate = collections.user
    const userCollection = typeof userCandidate === 'function'
      ? userCandidate()
      : userCandidate

    const userRolesProperty = userCollection.description.properties.roles as {
      items: StringProperty | EnumProperty
    }

    const userRoles = 'enum' in userRolesProperty.items
      ? userRolesProperty.items.enum as string[]
      : []

    result.roles = Array.from(new Set(userRoles.concat(await getAvailableRoles())))
  }

  if( props.router ) {
    result.router = await getEndpoints()
  }

  if( props.noSerialize || !('response' in contextOrPayload) ) {
    return Result.result(result)
  }

  contextOrPayload.response.setHeader('content-type', 'application/bson')
  return contextOrPayload.response.end(serialize(result))
}

