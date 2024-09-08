import type { AccessCondition } from './accessControl.js'
import type { CollectionSecurityPolicy, CollectionMiddleware } from './security.js'
import type { Context } from './context.js'
import type { Contract } from './contract.js'
import type { Description } from './description.js'
import type { SchemaWithId } from './schema.js'

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  functions?: Record<string, (payload: any, context: Context<any>, ...args: any[])=> any>
  contracts?: Record<string, Contract>
  exposedFunctions?: Record<string, AccessCondition>
  security?: CollectionSecurityPolicy<TCollection>
  middlewares?:
    | CollectionMiddleware<SchemaWithId<TCollection['description']>>
    | CollectionMiddleware<SchemaWithId<TCollection['description']>>[]
}

export type CollectionItem<TCollectionName extends keyof Collections> = Omit<Collections[TCollectionName]['item'], '_id'>
export type CollectionItemWithId<TCollectionName extends keyof Collections> = Collections[TCollectionName]['item']

export type AssetType = keyof Collection

