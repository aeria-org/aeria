import type {
  Context,
  ContextOptions,
  RouteContext,
  IndepthCollection,
  IndepthCollections,
  Collection,
  ApiConfig,
  GenericRequest,
  GenericResponse,
} from '@aeriajs/types'

import { throwIfError, endpointError } from '@aeriajs/common'
import { getCollections } from '@aeriajs/entrypoint'
import { limitRate } from '@aeriajs/security'
import { getDatabaseCollection } from './database.js'
import { preloadDescription } from './collection/preload.js'

const indepthCollection = (collectionName: string, collections: Record<string, Collection | (()=> Collection)>, parentContext: RouteContext) => {
  const candidate = collections[collectionName]
  const collection = typeof candidate === 'function'
    ? candidate()
    : candidate

  const proxiedFunctions = new Proxy<NonNullable<IndepthCollection<any>['functions']>>({}, {
    get: (_, functionName) => {
      if( typeof functionName !== 'string' ) {
        throw new Error()
      }

      const fn = collection.functions?.[functionName]
      if( !fn ) {
        return null
      }

      return async (props: unknown, ...args: unknown[]) => {
        const childContext = await createContext({
          parentContext,
          collectionName,
          inherited: true,
        })

        return fn(props, childContext, ...args)
      }
    },
  })

  return {
    ...collection,
    context: () => createContext({
      parentContext,
      collectionName,
    }),
    functions: proxiedFunctions,
    originalFunctions: collection.functions,
    model: getDatabaseCollection(collectionName),
  }
}

const isCollectionContext = (_context: unknown, collectionName: string | undefined): _context is Context => {
  return !!collectionName
}

export const createContext = async <TContextOptions extends ContextOptions>(_options?: TContextOptions) => {
  const options: ContextOptions = _options || {}
  const {
    collectionName,
    parentContext,
    token = parentContext?.token || {
      authenticated: false,
      sub: null,
    },
  } = options

  const { getCollectionAsset } = await import('./assets.js')
  const collections = await getCollections()

  let config: ApiConfig
  if( options.config ) {
    config = options.config
  } else if( parentContext?.config ) {
    config = parentContext.config
  } else {
    config = {
      security: {
        mutableUserProperties: [],
      },
    }
  }

  let
    request: GenericRequest,
    response: GenericResponse,
    inherited = !!options.inherited

  if( parentContext ) {
    request = parentContext.request
    response = parentContext.response
    inherited ||= parentContext.inherited
  } else {
    request = {} as GenericRequest
    response = {} as GenericResponse
  }

  const context: Context | RouteContext = {
    token,
    config,
    inherited,
    request,
    response,
    collections: new Proxy<IndepthCollections>({}, {
      get: (_, collectionName) => {
        if( typeof collectionName !== 'string' ) {
          throw new Error()
        }
        return indepthCollection(collectionName, collections, context)
      },
    }),
    log: async (message, details) => {
      return getDatabaseCollection('log').insertOne({
        message,
        details,
        context: collectionName,
        owner: token.sub,
        created_at: new Date(),
      })
    },

    error: (httpStatus, error) => {
      return endpointError(Object.assign({
        httpStatus,
      }, error))
    },
    limitRate: (params) => {
      return limitRate(params, context)
    },
  }

  if( isCollectionContext(context, collectionName) && collectionName ) {
    const description = throwIfError(await getCollectionAsset(collectionName , 'description'))
    context.description = await preloadDescription(description)
    context.collectionName = collectionName

    if( !options.calledFunction && parentContext && 'calledFunction' in parentContext ) {
      context.calledFunction = parentContext.calledFunction
    } else {
      context.calledFunction = options.calledFunction
    }

    context.collection = indepthCollection(collectionName, collections, context)
  }

  return context as TContextOptions extends { collectionName: unknown }
    ? Context
    : RouteContext
}

