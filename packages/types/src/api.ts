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
  contracts?: Record<string, Contract>
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
  userinfo: Omit<Collections['user']['item'], '_id' | 'roles'> extends infer UserItem
    ?
      | UserItem
      | PackReferences<UserItem>
    : never
}

export type UnauthenticatedToken = {
  authenticated: false
  sub: null
}

export type TokenRecipient = {
  type: 'bearer'
  content: string
}

// disable distributive conditional type by wrapping TAcceptedRole in a tuple
export type Token<TAcceptedRole extends AcceptedRole = null> = [TAcceptedRole] extends [null | 'unauthenticated']
  ?
    | AuthenticatedToken
    | UnauthenticatedToken
  : AuthenticatedToken<TAcceptedRole>

