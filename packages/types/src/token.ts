import type { ObjectId } from 'mongodb'
import type { PackReferences } from './schema.js'
import type { FunctionPath } from './collection.js'

export type UserRole =
  | (
    Collections['user']['item']['roles'][number] extends infer UserDefinedRole
      ? UserDefinedRole extends string
        ? `${UserDefinedRole}${UserDefinedRole}` extends UserDefinedRole
          ? 'root'
          : UserDefinedRole
        : never
      : never
  )
  | 'root'
  | 'unauthenticated'

export type AcceptedRole =
  | UserRole
  | UserRole[]
  | null
  | unknown

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
export type Token<TAcceptedRole extends AcceptedRole = null> = (
  null extends TAcceptedRole
    ? true
    : 'unauthenticated' extends TAcceptedRole
      ? true
      : false
) extends true
  ?
    | AuthenticatedToken
    | UnauthenticatedToken
  : AuthenticatedToken<TAcceptedRole>

