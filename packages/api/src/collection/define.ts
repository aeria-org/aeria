import type {
  SchemaWithId,
  Collection,
  Context,
  Contract,
  Description,

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
  const TFunctionContracts extends Partial<{
    [P in keyof TFunctions]: Contract
  }>,
  const TFunctions extends {
    [P: string]: (payload: any, context: Context<TDescription>, ...args: any[])=> any
  },
>(
  collection: TCollection & {
    description: TDescription
    functions?: TFunctions
    functionContracts?: TFunctionContracts
  },
) => {
  return collection as TCollection & {
    item: SchemaWithId<TDescription>
    description: TDescription
    functions: TFunctions
  }
}

