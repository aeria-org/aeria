import type { Context } from './context.js'
import type { InferProperties } from './schema.js'
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

export type Contract = ContractBase & {
  response?: Property | Property[]
  payload?: Property | Property[]
  query?: Property | Property[]
}

export type ContractWithRoles = ContractRoles & Contract

export type ContractToFunction<TContract extends Contract | ContractWithRoles, ContextParameter = Context> = (
  'payload' extends keyof TContract
    ? InferProperties<TContract['payload']>
    : undefined
) extends infer Payload
  ? (
    'response' extends keyof TContract
      ? InferProperties<TContract['response']> extends infer InferredResponse
        ? InferredResponse | Promise<InferredResponse>
        : never
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

