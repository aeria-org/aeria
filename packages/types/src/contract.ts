import type { Context } from './context.js'
import type { InferProperty } from './schema.js'
import type { InferResponse } from './http.js'
import type { Property } from './property.js'
import type { UserRole } from './token.js'

export type ContractBase = {
  // used internally to indicate the contract belongs to a builtin function
  builtin?: boolean
  streamed?: boolean
}

export type ContractRoles = {
  roles?:
    | readonly UserRole[]
    | boolean
    | 'unauthenticated'
    | 'unauthenticated-only'
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

