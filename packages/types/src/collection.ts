import type { AccessCondition } from './accessControl.js'
import type { CollectionSecurityPolicy } from './security.js'
import type { Context } from './context.js'
import type { Contract } from './contract.js'
import type { Description } from './description.js'

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  security?: CollectionSecurityPolicy<TCollection>
  functions?: Record<string, (payload: any, context: Context, ...args: any[])=> any>
  contracts?: Record<string, Contract>
  exposedFunctions?: Record<string, AccessCondition>
}

export type CollectionItem<TCollectionName extends keyof Collections> = Omit<Collections[TCollectionName]['item'], '_id'>
export type CollectionItemWithId<TCollectionName extends keyof Collections> = Collections[TCollectionName]['item']

export type AssetType = keyof Collection
export type FunctionPath = `/${string}/${string}`

