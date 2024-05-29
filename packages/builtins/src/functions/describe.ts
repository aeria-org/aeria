import type { Description, Context, RouteContext, Either, StringProperty, EnumProperty } from '@aeriajs/types'
import type { description as userDescription } from '../collections/user/description.js'
import { createContext, preloadDescription, getEndpoints } from '@aeriajs/core'
import { getCollections, getAvailableRoles } from '@aeriajs/entrypoint'
import { serialize, isLeft, left, unwrapEither } from '@aeriajs/common'
import { authenticate } from '../collections/user/authenticate.js'

type Payload = {
  collections?: string[]
  noSerialize?: boolean
  roles?: boolean
  revalidate?: boolean
  router?: boolean
}

export const describe = async (contextOrPayload: RouteContext | Payload) => {
  const result = {} as {
    descriptions: typeof descriptions
    roles?: string[]
    auth?: Awaited<ReturnType<typeof authenticate>> extends Either<unknown, infer Right>
      ? Partial<Right>
      : never
    router?: any
  }

  const props = 'request' in contextOrPayload
    ? contextOrPayload.request.payload
    : contextOrPayload

  if( 'request' in contextOrPayload && props.revalidate ) {
    const authEither = await authenticate({
      revalidate: true,
    }, <Context<typeof userDescription>>await createContext({
      collectionName: 'user',
      parentContext: contextOrPayload,
    }))

    if( isLeft(authEither) ) {
      const error = unwrapEither(authEither)
      return left(error)
    }

    const auth = unwrapEither(authEither)
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
      ? userRolesProperty.items.enum
      : []

    result.roles = Array.from(new Set(userRoles.concat(await getAvailableRoles())))
  }

  if( props.router ) {
    result.router = await getEndpoints()
  }

  if( props.noSerialize || !('response' in contextOrPayload) ) {
    return result
  }

  contextOrPayload.response.setHeader('content-type', 'application/bson')
  return contextOrPayload.response.end(serialize(result))
}

