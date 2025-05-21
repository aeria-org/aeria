import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { signToken } from '@aeriajs/core'
import { Result, HTTPStatus, defineContract, resultSchema, endpointErrorSchema, functionSchemas } from '@aeriajs/types'
import { ActivationError } from './activate.js'

export const getActivationLinkContract = defineContract({
  payload: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'string',
        format: 'objectid',
      },
      redirect: {
        type: 'string',
      },
    },
  },
  response: [
    functionSchemas.getError(),
    endpointErrorSchema({
      httpStatus: [
        HTTPStatus.BadRequest,
        HTTPStatus.Forbidden,
      ],
      code: [
        ActivationError.InvalidLink,
        ActivationError.AlreadyActiveUser,
      ],
    }),
    resultSchema({
      type: 'object',
      properties: {
        url: {
          type: 'string',
        },
      },
    }),
  ],
})

export const getActivationToken = async (userId: string, context: Context) => {
  if( context.calledFunction === 'getActivationToken' ) {
    throw new Error('cannot be called externally')
  }
  if( !context.config.secret ) {
    throw new Error('config.secret is not set')
  }

  const token = await signToken({
    data: userId,
  }, context.config.secret, {
    expiresIn: context.config.security.linkTokenExpiration,
  })

  return token
}

export const getActivationLink: ContractToFunction<typeof getActivationLinkContract, Context<typeof description>> = async (payload, context) => {
  if(!context.config.webPublicUrl){
    return context.error(HTTPStatus.BadRequest, {
      code: ActivationError.InvalidLink,
    })
  }
  const { error, result: user } = await context.collections.user.functions.get({
    filters: {
      _id: payload.userId,
    },
    project: ['active'],
  })

  if( error ) {
    return Result.error(error)
  }

  if( user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.AlreadyActiveUser,
    })
  }

  const activationToken = await getActivationToken(payload.userId.toString(), context)

  const url = new URL(`${context.config.webPublicUrl}/user/activation`)
  url.searchParams.set('u', payload.userId.toString())
  url.searchParams.set('t', activationToken)

  if( !user.password ) {
    url.searchParams.set('step', 'password')
  }
  if( payload.redirect ){
    url.searchParams.set('next', payload.redirect)
  }

  return Result.result({
    url: url.toString(),
  })
}
