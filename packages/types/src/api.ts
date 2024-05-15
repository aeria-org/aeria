import type { ObjectId } from 'mongodb'
import type {
  Context,
  Contract,
  Description,
  CollectionSecurityPolicy,
  PackReferences,

} from '.'

export type AcceptedRole =
  | UserRole
  | UserRole[]
  | null
  | unknown

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  security?: CollectionSecurityPolicy<TCollection>
  functions?: Record<string, (payload: any, context: Context, ...args: any[])=> any>
  functionContracts?: Record<string, Contract>
  exposedFunctions?: Record<string, readonly string[] | boolean>
}

export type AssetType = keyof Collection
export type FunctionPath = `/${string}/${string}`

export type UserRole =
  | Collections['user']['item']['roles'][number]
  | 'root'
  | 'guest'

export type AuthenticatedToken<TAcceptedRole extends AcceptedRole = null> = {
  authenticated: true
  sub: ObjectId
  roles: readonly (
    TAcceptedRole extends null
      ? string
      : TAcceptedRole
  )[]
  allowed_functions?: readonly FunctionPath[]
  userinfo:
    | Collections['user']['item']
    | PackReferences<Collections['user']['item']>
}

export type UnauthenticatedToken = {
  authenticated: false
  sub: null
}

export type TokenRecipient = {
  type: 'bearer'
  content: string
}

export type Token<TAcceptedRole extends AcceptedRole = null> = (
  TAcceptedRole extends any[]
    ? TAcceptedRole[number]
    : TAcceptedRole
) extends infer NormalizedRole
  ? NormalizedRole extends null | 'guest'
    ?
      | AuthenticatedToken
      | UnauthenticatedToken
    : AuthenticatedToken<NormalizedRole>
  : never

