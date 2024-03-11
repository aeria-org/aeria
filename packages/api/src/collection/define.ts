import type {
  SchemaWithId,
  Collection,
  CollectionFunctionsWithContext,
  Context,
  Contract,
  ContractToFunction,
  Description,
  AccessControl,

} from '@aeriajs/types'

export const defineCollection = <
  TCollection extends Collection<TCollection extends Collection ? TCollection : never> extends infer Coll
    ? Omit<Coll,
      | 'item'
      | 'description'
      | 'functions'
    >
    : never,
  const TDescription extends Description<TDescription>,
  const TFunctionContracts extends {
    [P in keyof TFunctions]: Contract
  },
  const TFunctions extends {
    [P in keyof TFunctionContracts]: TFunctionContracts[P] extends Contract
      ? ContractToFunction<TFunctionContracts[P], Context<TDescription>>
      : (payload: any, context: Context<TDescription>, ...args: any[])=> any
  },
>(
  collection: TCollection & {
    description: TDescription
    functions?: TFunctions
    functionContracts?: TFunctionContracts
    accessControl?: AccessControl<{
      description: TDescription
      functions: typeof collection['functions']
    }>,
  } & {
    functions?: Partial<CollectionFunctionsWithContext<SchemaWithId<TDescription>, TDescription, TFunctions>>
  },
) => {
  return collection as unknown as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functions: TFunctions
    functionContracts: TFunctionContracts
  }
}

