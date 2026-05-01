import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, defineContract, resultSchema, endpointErrorSchema, functionSchemas } from '@aeriajs/types'
import { ActivationError } from './activate.js'
import { getActivationToken } from './getActivationToken.js'

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
        HTTPStatus.NotFound,
      ],
      code: [
        ActivationError.InvalidLink,
        ActivationError.UserNotFound,
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

export const getActivationLink: ContractToFunction<typeof getActivationLinkContract, Context<typeof description>> = async (payload, context) => {
  if(!context.config.webPublicUrl){
    return context.error(HTTPStatus.BadRequest, {
      code: ActivationError.InvalidLink,
    })
  }
  const user = await context.collections.user.model.findOne({
    _id: payload.userId,
  }, {
    projection: {
      active: 1,
      password: 1,
    }
  })

  if( !user ) {
    return Result.error({
      httpStatus: HTTPStatus.NotFound,
      code: ActivationError.UserNotFound,
    })
  }

  if( user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.AlreadyActiveUser,
    })
  }

  const activationToken = await getActivationToken(user, context)

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
