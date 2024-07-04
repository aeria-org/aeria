import type { Context, Token, TokenRecipient } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, ACError } from '@aeriajs/types'
import { compare as bcryptCompare } from 'bcrypt'
import { decodeToken } from '@aeriajs/core'
import { successfulAuthentication, defaultSuccessfulAuthentication, AuthenticationError } from '../../authentication.js'

type Props = {
  email: string
  password: string
} | {
  token?: TokenRecipient
  revalidate: true
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

    return Result.result(decodedToken.sub
      ? await successfulAuthentication(decodedToken.sub, context)
      : await defaultSuccessfulAuthentication())
  }

  if( typeof props.email !== 'string' ) {
    return context.error(HTTPStatus.Unauthorized, {
      code: AuthenticationError.InvalidCredentials,
    })
  }

  if( context.config.defaultUser ) {
    if( props.email === context.config.defaultUser.username && props.password === context.config.defaultUser.password ) {
      return Result.result(await defaultSuccessfulAuthentication())
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

  return Result.result(await successfulAuthentication(user._id, context))
}

