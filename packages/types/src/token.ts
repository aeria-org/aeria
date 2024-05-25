import type { ObjectId } from 'mongodb'
import type { PackReferences } from './schema.js'
import type { FunctionPath } from './collection.js'
import type { AcceptedRole } from './accessControl.js'

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

