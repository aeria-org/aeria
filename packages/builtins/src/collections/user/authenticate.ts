import type { Context, ContractToFunction, Token } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, ACError, defineContract, endpointErrorSchema, resultSchema } from '@aeriajs/types'
import { compare as bcryptCompare } from 'bcryptjs'
import { decodeToken, get } from '@aeriajs/core'
import { throwIfError } from '@aeriajs/common'
import { successfulAuthentication, defaultSuccessfulAuthentication, AuthenticationError } from '../../authentication.js'

export const authenticateContract = defineContract({
  payload: {
    type: 'object',
    required: [],
    properties: {
      email: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
      revalidate: {
        type: 'boolean',
      },
      token: {
        type: 'object',
        properties: {
          type: {
            enum: ['bearer'],
          },
          content: {
            type: 'string',
          },
        },
      },
    },
  },
  response: [
    endpointErrorSchema({
      httpStatus: [HTTPStatus.Unauthorized],
      code: [
        ACError.AuthorizationError,
        AuthenticationError.InvalidCredentials,
        AuthenticationError.InactiveUser,
      ],
    }),
    resultSchema({
      type: 'object',
      properties: {
        user: {
          $ref: 'user',
        },
        token: {
          type: 'object',
          properties: {
            type: {
              enum: ['bearer'],
            },
            content: {
              type: 'string',
            },
          },
        },
      },
    }),
    resultSchema({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            _id: {
              const: null,
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
              }
            },
            active: {
              type: 'boolean'
            }
          },
        },
        token: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
          },
        },
      },
    }),
  ],
})

export const authenticate = async (
  props: Parameters<ContractToFunction<typeof authenticateContract>>[0],
  context: Context<typeof description>
): Promise<ReturnType<ContractToFunction<typeof authenticateContract>>> => {
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

      if( !decodedToken.sub ) {
        return Result.result(await defaultSuccessfulAuthentication())
      }

      const { error, result: user } = await context.collections.user.functions.get({
        filters: {
          _id: decodedToken.sub,
          active: true,
        },
        populate: ['picture_file'],
      })

      if( error ) {
        throw new Error()
      }

      return Result.result(await successfulAuthentication(user, context))
  }

  if( typeof props.email !== 'string' || props.password !== 'string' ) {
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

