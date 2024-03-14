import type {
  SchemaWithId,
  Collection,
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
  } | {},
) => {
  return collection as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functionContracts: TFunctionContracts
    accessControl: AccessControl
  }
}

