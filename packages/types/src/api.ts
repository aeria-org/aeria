import type { ObjectId } from 'mongodb'
import type {
  Context,
  Contract,
  Description,
  CollectionSecurityPolicy,
  AccessControl,
  PackReferences,

} from '.'

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  security?: CollectionSecurityPolicy<TCollection>
  accessControl?: AccessControl<TCollection>
  functions?: Record<string, (payload: any, context: Context, ...args: any[])=> any>
  functionContracts?: Record<string, Contract>
}

export type AssetType = keyof Collection
export type FunctionPath = `${string}@${string}`

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}

export type AuthenticatedToken = {
  authenticated: true
  sub: ObjectId
  roles: string[]
  userinfo: PackReferences<Collections['user']['item']>
  allowed_functions?: FunctionPath[]
}

export type UnauthenticatedToken = {
  authenticated: false
  sub: null
}

export type DecodedToken =
  | AuthenticatedToken
  | UnauthenticatedToken

