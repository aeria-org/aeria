import type { Property, InferProperty, InferResponse, Context } from '.'

export type ContractBase = {
  builtin?: boolean
}

export type ContractRoles = {
  roles?: (
    | Collections['user']['item']['roles'][number]
    | 'root'
    | 'guest'
  )[]
}

export type Contract = ContractBase & (
  | { response: Property | Property[] }
  | { payload: Property }
  | { query: Property }
  | {
    response?: Property | Property[]
    payload?: Property
    query?: Property
  }
)

export type ContractWithRoles = ContractRoles & Contract

export type ContractToFunction<TContract extends Contract | ContractWithRoles, ContextParameter = Context> = (
  'payload' extends keyof TContract
    ? InferProperty<TContract['payload']>
    : undefined
) extends infer Payload
  ? (
    'response' extends keyof TContract
      ? InferResponse<TContract['response']>
      : any
  ) extends infer Response
    ? Payload extends undefined
      ? (payload: Payload | undefined, context: ContextParameter)=> Response
      : (payload: Payload, context: ContextParameter)=> Response
    : never
  : never

export const defineContract = <const TContractWithRoles extends ContractWithRoles>(contract: TContractWithRoles) => {
  return contract
}

