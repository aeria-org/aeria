import type {
  SchemaWithId,
  Collection,
  StrictContext,
  Contract,
  ContractToFunction,
  Description,
  CollectionSecurityPolicy,
  AccessCondition,
  RoleFromAccessCondition,
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
  const TContracts extends {
    [P in keyof TFunctions]?: Contract
  },
  const TExposedFunctions extends Partial<
    Record<
      keyof TFunctions,
      AccessCondition
    >
  >,
  const TFunctions extends {
    [P in keyof TContracts | keyof TExposedFunctions]: ContractToFunction<
      P extends keyof TContracts
        ? NonNullable<TContracts[P]>
        : any,
      StrictContext<
        P extends keyof TExposedFunctions
          ? RoleFromAccessCondition<TExposedFunctions[P]>
          : never,
        TDescription
      >
    >
  },
>(
  collection: TCollection & {
    description: TDescription
    functions?: TFunctions
    contracts?: TContracts
    exposedFunctions?: TExposedFunctions
    security?: CollectionSecurityPolicy<{
      description: NoInfer<TDescription>
      functions: NoInfer<TFunctions>
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
    contracts: TContracts
  }
}

import { type RouteContext } from '@aeriajs/types'
declare const fn: (context: RouteContext<'root'>)=> void

defineCollection({
  description: {
    $id: 'test',
    properties: {
      name: {
        type: 'string',
      },
    },
  },
  functions: {
    teste: (payload, context) => {
      fn(context)
      // context.token.roles.includes('root')
    },
  },
  security: {
    functions: {
      teste: {},
    },
  },
  contracts: {
    teste: {
      payload: {
        type: 'object',
        properties: {
          name: {
            type: 'boolean',
          },
        },
      },
    },
  },
  exposedFunctions: {
    teste: ['root2'],
  },
})

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

