import type { RouteContext, SchemaWithId, TokenRecipient } from '@aeriajs/types'
import type { ObjectId } from '@aeriajs/core'
import type { description } from './collections/user/description.js'
import { signToken } from '@aeriajs/core'

export type SuccessfulAuthentication = {
  user: Pick<SchemaWithId<typeof description>,
    | 'name'
    | 'email'
    | 'roles'
    | 'active'
  > & {
    _id: ObjectId | null
  }
  token: TokenRecipient
}

export enum AuthenticationError {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InactiveUser = 'INACTIVE_USER',
}

export const successfulAuthentication = async (userId: ObjectId, context: RouteContext): Promise<SuccessfulAuthentication> => {
  const { error, result: user } = await context.collections.user.functions.get({
    filters: {
      _id: userId,
    },
    populate: ['picture_file'],
  })


  if( error ) {
    throw new Error()
  }
  const tokenContent = {
    sub: user._id,
    roles: user.roles,
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
    const pick = (obj: any, properties: string[]) => properties.reduce((a, prop) => {
      if( 'prop' in obj ) {
        return a
      }

      return {
        ...a,
        [prop]: obj[prop],
      }
    }, {})

    tokenContent.userinfo = pick(user, context.config.tokenUserProperties)
  }

  const token = await signToken(tokenContent)

  return {
    user: user,
    token: {
      type: 'bearer',
      content: token,
    },
  }
}

export const defaultSuccessfulAuthentication = async () => {
  const token = await signToken({
    _id: null,
    roles: ['root'],
    userinfo: {},
  })

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

