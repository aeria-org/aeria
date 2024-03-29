import type {
  SchemaWithId,
  Collection,
  Context,
  Contract,
  ContractToFunction,
  Description,
  AccessControl,
} from '@aeriajs/types'

import { deepMerge } from '@aeriajs/common'

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
    >
    : never,
  const TDescription extends Description<TDescription>,
  const TFunctionContracts extends {
    [P in keyof TFunctions]?: Contract
  },
  const TFunctions extends {
    [P in keyof TFunctionContracts]: ContractToFunction<NonNullable<TFunctionContracts[P]>, Context<TDescription>>
  },
>(
  collection: TCollection & {
    description: TDescription
    functionContracts?: TFunctionContracts
    accessControl?: AccessControl<{
      description: NoInfer<TDescription>
      functions: Record<string, any>
    }>
  } & (
    | { functions?: TFunctions }
    | { functions?: Record<string, unknown> }
  ),
) => {
  return collection as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functions: TFunctions
    functionContracts: TFunctionContracts
    accessControl: AccessControl
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

