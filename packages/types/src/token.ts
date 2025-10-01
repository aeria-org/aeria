import type { ObjectId } from 'mongodb'
import type { PackReferences } from './schema.js'
import type { AccessCondition } from './accessControl.js'

export type UserInfo = Omit<Collections['user']['item'], '_id' | 'roles'>

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

export type TokenBase = {
  exp: number
  iat: number
}

export type AuthenticatedToken<
  TAccessCondition extends AccessCondition = true,
  TUserRole = UserRole,
> = TokenBase & {
  authenticated: true
  sub: ObjectId | null
  roles: TAccessCondition extends readonly unknown[]
    ? TAccessCondition
    : TAccessCondition extends true
      ? readonly TUserRole[]
      : TAccessCondition extends 'unauthenticated'
        ? readonly UserRole[]
        : readonly []
  picture?: string
  userinfo: Partial<
    | UserInfo
    | PackReferences<UserInfo>
  >
}

export type UnauthenticatedToken = TokenBase & {
  authenticated: false
  sub: null
}

export type TokenRecipient = {
  type: 'bearer'
  content: string
}

export type Token<
  TAccessCondition extends AccessCondition = false,
  TUserRole = UserRole,
> = (
  false extends TAccessCondition
    ? false
    : TAccessCondition extends 'unauthenticated' | 'unauthenticated-only'
      ? false
      : true
) extends true
  ? AuthenticatedToken<TAccessCondition>
  :
  'unauthenticated-only' extends TAccessCondition
    ? UnauthenticatedToken
    :
        | AuthenticatedToken<true, TUserRole>
        | UnauthenticatedToken

