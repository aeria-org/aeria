import type {
  Context,
  ContextOptions,
  IndepthCollection,
  IndepthCollections,
  DecodedToken,
  Collection,
} from '@aeriajs/types'

import { unsafe } from '@aeriajs/common'
import { getCollections } from '@aeriajs/entrypoint'
import { getDatabaseCollection } from './database.js'
import { preloadDescription } from './collection/preload.js'

const indepthCollection = (collectionName: string, collections: Record<string, Collection | (()=> Collection)>, parentContext: Context) => {
  const candidate = collections[collectionName]
  const collection = typeof candidate === 'function'
    ? candidate()
    : candidate

  const proxiedFunctions = new Proxy<NonNullable<IndepthCollection<any>['functions']>>({}, {
    get: (_: unknown, functionName: string) => {
      return async (props: any, ...args: any[]) => {
        if( !collection.functions ) {
          return null
        }

        const childContext = await createContext({
          parentContext,
          collectionName,
        })

        return collection.functions[functionName](props, childContext, ...args)
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

export const internalCreateContext = async (options: ContextOptions<any>, parentContext: Context) => {
  const {
    collectionName,
    token = {} as DecodedToken,
  } = options

  const { getCollectionAsset } = await import('./assets.js')
  const collections = await getCollections()

  const context = Object.assign({}, parentContext)
  Object.assign(context, options)

  context.log = async (message: string, details?: any) => {
    return getDatabaseCollection('log').insertOne({
      message,
      details,
      context: collectionName,
      owner: token.authenticated
        ? token.sub
        : options.parentContext?.token.sub,
      created_at: new Date,
    })
  }

  if( collectionName ) {
    const description = unsafe(await getCollectionAsset(collectionName , 'description'))
    context.description = await preloadDescription(description)

    context.collectionName = collectionName
    context.collection = indepthCollection(collectionName, collections, context)
  }

  context.collections = new Proxy<IndepthCollections>({}, {
    get: (_: unknown, collectionName: string) => {
      return indepthCollection(collectionName, collections, context)
    },
  })

  return context
}

export const createContext = async (_options?: ContextOptions<any>) => {
  const options = _options as ContextOptions<Context>
  const context = Object.assign({}, options.parentContext || {}) as Context

  Object.assign(context, await internalCreateContext(options, context))
  return context
}
