import type { Context, SchemaWithId, Token, TokenRecipient } from '@aeriajs/types'
import type { description } from './description.js'
import type { ObjectId } from '@aeriajs/core'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { compare as bcryptCompare } from 'bcrypt'
import { signToken, decodeToken } from '@aeriajs/core'

type Props = {
  email: string
  password: string
} | {
  token?: TokenRecipient
  revalidate: true
}

type Return = {
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

const getUser = async (
  userId: ObjectId,
  context: Context<typeof description, Collections['user']['functions']>,
): Promise<Return> => {
  const leanUser = await context.collection.functions.get({
    filters: {
      _id: userId,
    },
    populate: ['picture_file'],
  })

  if( !leanUser ) {
    throw new Error()
  }

  const tokenContent = {
    sub: leanUser._id,
    roles: leanUser.roles,
    userinfo: {},
  }

  if( context.config.security.authenticationRateLimiting ) {
    //
  }

  if( context.config.security.logSuccessfulAuthentications ) {
    await context.log('successful authentication', {
      email: leanUser.email,
      roles: leanUser.roles,
      _id: leanUser._id,
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

    tokenContent.userinfo = pick(leanUser, context.config.tokenUserProperties)
  }

  const token = await signToken(tokenContent)

  return {
    user: leanUser,
    token: {
      type: 'bearer',
      content: token,
    },
  }
}

export const getDefaultUser = async () => {
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

export const authenticate = async (props: Props, context: Context<typeof description>) => {
  if( 'revalidate' in props ) {
    const { token } = props
    if( !token && !context.token.authenticated ) {
      return context.error(HTTPStatus.Unauthorized, {
        code: ACError.AuthorizationError,
      })
    }

    const decodedToken = token
      ? await decodeToken<Token>(token.content)
      : context.token

    return decodedToken.sub
      ? getUser(decodedToken.sub, context)
      : getDefaultUser()
  }

  if( typeof props.email !== 'string' ) {
    return context.error(HTTPStatus.Unauthorized, {
      code: AuthenticationError.InvalidCredentials,
    })
  }

  if( context.config.defaultUser ) {
    if( props.email === context.config.defaultUser.username && props.password === context.config.defaultUser.password ) {
      return getDefaultUser()
    }
  }

  const user = await context.collection.model.findOne(
    {
      email: props.email,
    },
    {
      projection: {
        email: 1,
        password: 1,
        active: 1,
      },
    },
  )

  if( !user || !user.password || !await bcryptCompare(props.password, user.password) ) {
    return context.error(HTTPStatus.Unauthorized, {
      code: AuthenticationError.InvalidCredentials,
    })
  }

  if( !user.active ) {
    return context.error(HTTPStatus.Unauthorized, {
      code: AuthenticationError.InactiveUser,
    })
  }

  return getUser(user._id, context)
}

