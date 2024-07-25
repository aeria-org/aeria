import type { Context, Token, TokenRecipient } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, ACError } from '@aeriajs/types'
import { compare as bcryptCompare } from 'bcrypt'
import { decodeToken, get } from '@aeriajs/core'
import { throwIfError } from '@aeriajs/common'
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

    const { error, result: user } = await context.collections.user.functions.get({
      filters: {
        _id: decodedToken.sub,
      },
      populate: ['picture_file'],
    })

    if( error ) {
      throw new Error()
    }

    return Result.result(decodedToken.sub
      ? await successfulAuthentication(user, context)
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

  const completeUser = throwIfError(await get({
    filters: {
      _id: user._id,
    },
    populate: ['picture_file'],
  }, context))

  return Result.result(await successfulAuthentication(completeUser, context))
}

