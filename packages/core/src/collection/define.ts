import type {
  SchemaWithId,
  Collection,
  Context,
  Contract,
  ContractToFunction,
  Description,
  CollectionSecurityPolicy,
} from '@aeriajs/types'

import { deepMerge, freshItem } from '@aeriajs/common'

export type ExtendCollection<
  TLeftCollection extends Collection,
  TRightCollection,
> = Omit<TLeftCollection & TRightCollection, 'item'> & {
  item: SchemaWithId<(TLeftCollection & TRightCollection)['description']>
}

export const defineCollection = <
  TCollection extends Collection<TCollection extends Collection ? TCollection : never> extends infer Coll
    ? Omit<
      Coll,
      | 'item'
      | 'description'
      | 'functions'
      | 'exposedFunctions'
      | 'security'
    >
    : never,
  const TDescription extends Description<TDescription>,
  const TFunctionContracts extends {
    [P in keyof TFunctions]?: Contract
  },
  const TFunctions extends Record<string, (payload: any, context: Context) => any> & {
    [P in keyof TFunctionContracts]: ContractToFunction<
      NonNullable<TFunctionContracts[P]>,
      Context<TDescription>
    >
  },
>(
  collection: TCollection & {
    description: TDescription
    functions?: TFunctions
    functionContracts?: TFunctionContracts
    exposedFunctions?: Partial<
      Record<
        keyof TFunctions,
        | readonly string[]
        | boolean
        | 'unauthenticated'
        | 'unauthenticated-only'
      >
    >
    security?: CollectionSecurityPolicy<{
      description: NoInfer<TDescription>
      functions: TFunctions
    }>
  },
) => {
  return Object.assign(
    {
      item: freshItem(collection.description),
    },
    collection,
  ) as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functions: TFunctions
    functionContracts: TFunctionContracts
  }
}

export const extendCollection = <
  const TLeftCollection extends Collection,
  const TRightCollection extends {
    [P in keyof Collection]?: Partial<Collection[P]>
  },
>(
  left: TLeftCollection,
  right: TRightCollection,
) => {
  return deepMerge(left, right) as ExtendCollection<TLeftCollection, TRightCollection>
}

