import type { RouteContext, SchemaWithId, TokenRecipient, AuthenticatedToken, UserRole } from '@aeriajs/types'
import type { description } from './collections/user/description.js'
import { signToken } from '@aeriajs/core'

type User = SchemaWithId<typeof description>

export type TokenableUser = Pick<User,
  | '_id'
  | 'name'
  | 'email'
  | 'roles'
  | 'active'
  | 'picture'
>

export type SuccessfulAuthentication = {
  user: TokenableUser
  token: TokenRecipient
}

export const AuthenticationError = {
  InvalidCredentials: 'INVALID_CREDENTIALS',
  InactiveUser: 'INACTIVE_USER',
} as const

export const successfulAuthentication = async <TUser extends TokenableUser>(user: TUser, context: RouteContext): Promise<SuccessfulAuthentication> => {
  const tokenContent: Omit<AuthenticatedToken, 'authenticated'> = {
    sub: user._id,
    roles: user.roles as UserRole[],
    picture: user.picture,
    userinfo: {},
  }

  if( context.config.security.authenticationRateLimiting ) {
    //
  }

  if( context.config.security.logSuccessfulAuthentications ) {
    await context.log('successful authentication', {
      email: user.email,
      roles: user.roles,
      _id: user._id,
    })
  }

  if( context.config.tokenUserProperties ) {
    const userinfo: {
      -readonly [P in keyof TUser]?: TUser[P]
    } = {}

    for( const prop of context.config.tokenUserProperties ) {
      userinfo[prop as keyof typeof userinfo] = user[prop as keyof typeof user]
    }

    tokenContent.userinfo = userinfo
  }

  const token = await signToken(tokenContent)

  return {
    user,
    token: {
      type: 'bearer',
      content: token,
    },
  }
}

export const defaultSuccessfulAuthentication = async () => {
  const token = await signToken({
    sub: null,
    roles: ['root'],
    userinfo: {},
  } satisfies Omit<AuthenticatedToken, 'authenticated'>)

  return {
    user: {
      _id: null,
      name: 'God Mode',
      email: '',
      roles: ['root'],
      active: true,
    },
    token: {
      type: 'bearer',
      content: token,
    },
  }
}

