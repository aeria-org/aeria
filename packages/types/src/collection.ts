import type { WithId } from 'mongodb'
import type { AccessCondition } from './accessControl.js'
import type { CollectionSecurityPolicy, CollectionMiddleware } from './security.js'
import type { Context } from './context.js'
import type { Contract } from './contract.js'
import type { Description } from './description.js'

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item: WithId<unknown>
  functions?: Record<string, (payload: any, context: Context<any>, ...args: any[])=> any>
  contracts?: Record<string, Contract>
  exposedFunctions?: Record<string, AccessCondition>
  security?: CollectionSecurityPolicy<TCollection>
  middlewares?:
    | CollectionMiddleware<any>
    | CollectionMiddleware<any>[]
}

export type CollectionItem<TCollectionName extends keyof Collections> = Omit<Collections[TCollectionName]['item'], '_id'>
export type CollectionItemWithId<TCollectionName extends keyof Collections> = Collections[TCollectionName]['item']

export type AssetType = keyof Collection

