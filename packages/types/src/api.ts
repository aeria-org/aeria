import type { ObjectId } from 'mongodb'
import type {
  Context,
  Contract,
  Description,
  CollectionSecurityPolicy,
  PackReferences,
  AcceptedRole,
  AccessCondition,

} from '.'

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  security?: CollectionSecurityPolicy<TCollection>
  functions?: Record<string, (payload: any, context: Context, ...args: any[])=> any>
  functionContracts?: Record<string, Contract>
  exposedFunctions?: Record<string, AccessCondition>
}

export type CollectionItem<TCollectionName extends keyof Collections> = Omit<Collections[TCollectionName]['item'], '_id'>
export type CollectionItemWithId<TCollectionName extends keyof Collections> = Collections[TCollectionName]['item']

export type AssetType = keyof Collection
export type FunctionPath = `/${string}/${string}`

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

