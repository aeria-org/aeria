import type { ObjectId } from 'mongodb'
import type { PackReferences } from './schema.js'

export type UserRole =
  | (
    Collections['user']['item'] extends { roles: infer Roles }
      ? Roles extends unknown[]
        ? Roles[number] extends infer UserDefinedRole
          ? UserDefinedRole extends string
            ? `${UserDefinedRole}${UserDefinedRole}` extends UserDefinedRole
              ? 'root'
              : UserDefinedRole
            : never
          : never
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

export type AuthenticatedToken<
  TAcceptedRole extends AcceptedRole = null,
  TUserRole = UserRole,
  TUserInfo = Omit<Collections['user']['item'], '_id' | 'roles'>,
> = {
  authenticated: true
  sub: ObjectId | null
  roles: readonly (
    TAcceptedRole extends null
      ? TUserRole
      : TAcceptedRole
  )[]
  picture?: string
  userinfo: Partial<
    | TUserInfo
    | PackReferences<TUserInfo>
  >
}

export type UnauthenticatedToken = {
  authenticated: false
  sub: null
}

export type TokenRecipient = {
  type: 'bearer'
  content: string
}

export type Token<
  TAcceptedRole extends AcceptedRole = null,
  TUserRole = UserRole,
  TUserInfo = Omit<Collections['user']['item'], '_id' | 'roles'>,
> = (
  null extends TAcceptedRole
    ? true
    : 'unauthenticated' extends TAcceptedRole
      ? true
      : false
) extends true
  ?
    | AuthenticatedToken<null, TUserRole, TUserInfo>
    | UnauthenticatedToken
  : AuthenticatedToken<TAcceptedRole>

