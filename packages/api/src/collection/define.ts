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
      | 'functionContracts'
      | 'accessControl'
    >
    : never,
  const TDescription extends Description<TDescription>,
  const TFunctionContracts extends Partial<{
    [P in keyof TFunctions]: Contract
  }>,
  const TFunctions extends {
    [P in keyof TFunctionContracts]: ContractToFunction<NonNullable<TFunctionContracts[P]>, Context<TDescription>>
  },
>(
  collection: TCollection & {
    description: TDescription
    functions?: TFunctions
    functionContracts?: TFunctionContracts
    accessControl?: AccessControl<{
      description: TDescription
      functions: NoInfer<TFunctions>
    }>
  } | {
    functions?: Record<string, unknown> & Partial<CollectionFunctionsWithContext<
      SchemaWithId<TDescription>,
      TDescription,
      any
    >>
  },
) => {
  return collection as unknown as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functions: TFunctions
    functionContracts: TFunctionContracts
    accessControl: AccessControl
  }
}

