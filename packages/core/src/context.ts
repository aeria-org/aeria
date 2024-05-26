import type {
  Context,
  ContextOptions,
  IndepthCollection,
  IndepthCollections,
  Token,
  Collection,
} from '@aeriajs/types'

import { unsafe, error } from '@aeriajs/common'
import { getCollections } from '@aeriajs/entrypoint'
import { limitRate } from '@aeriajs/security'
import { getDatabaseCollection } from './database.js'
import { preloadDescription } from './collection/preload.js'

const indepthCollection = (collectionName: string, collections: Record<string, Collection | (()=> Collection)>, parentContext: Context) => {
  const candidate = collections[collectionName]
  const collection = typeof candidate === 'function'
    ? candidate()
    : candidate

  const proxiedFunctions = new Proxy<NonNullable<IndepthCollection<any>['functions']>>({}, {
    get: (_, functionName) => {
      if( typeof functionName !== 'string' ) {
        throw new Error()
      }

      if( !collection.functions?.[functionName] ) {
        return null
      }

      return async (props: any, ...args: any[]) => {
        const childContext = await createContext({
          parentContext,
          collectionName,
          inherited: true,
        })

        return collection.functions![functionName](props, childContext, ...args)
      }
    },
  })

  return {
    ...collection,
    functions: proxiedFunctions,
    originalFunctions: collection.functions,
    model: getDatabaseCollection(collectionName),
  }
}

export const createContext = async (options: ContextOptions = {}) => {
  const {
    collectionName,
    parentContext = {},
    token = {} as Token,
  } = options

  const { getCollectionAsset } = await import('./assets.js')
  const collections = await getCollections()

  const context = Object.assign({} as Context, parentContext)
  Object.assign(context, options)

  context.log = async (message, details) => {
    return getDatabaseCollection('log').insertOne({
      message,
      details,
      context: collectionName,
      owner: token.authenticated
        ? token.sub
        : options.parentContext?.token.sub,
      created_at: new Date(),
    })
  }

  context.error = (httpStatus, endpointError) => {
    return error(Object.assign({
      httpStatus,
    }, endpointError), context)
  }

  context.limitRate = (params) => {
    return limitRate(params, context)
  }

  if( collectionName ) {
    const description = unsafe(await getCollectionAsset(collectionName , 'description'))
    context.description = await preloadDescription(description)

    context.collectionName = collectionName
    context.collection = indepthCollection(collectionName, collections, context)
  }

  context.collections = new Proxy<IndepthCollections>({}, {
    get: (_, collectionName) => {
      if( typeof collectionName !== 'string' ) {
        throw new Error()
      }
      return indepthCollection(collectionName, collections, context)
    },
  })

  return context
}

