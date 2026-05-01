import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, resultSchema, functionSchemas, endpointErrorSchema, defineContract } from '@aeriajs/types'
import { RedefinePasswordError } from './redefinePassword.js'
import { getActivationToken } from './getActivationToken.js'

export const getRedefinePasswordLinkContract = defineContract({
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
        HTTPStatus.Forbidden,
        HTTPStatus.NotFound,
      ],
      code: [
        RedefinePasswordError.UserNotActive,
        RedefinePasswordError.UserNotFound,
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

export const getRedefinePasswordLink: ContractToFunction<typeof getRedefinePasswordLinkContract, Context<typeof description>> = async (payload, context) => {
  if(!context.config.webPublicUrl){
    throw new Error('config.webPublicUrl is not set')
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
      httpStatus: HTTPStatus.Forbidden,
      code: RedefinePasswordError.UserNotFound,
    })
  }

  if( !user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: RedefinePasswordError.UserNotActive,
    })
  }

  const redefineToken = await getActivationToken(user, context)

  const url = new URL(`${context.config.webPublicUrl}/user/redefine-password`)
  url.searchParams.set('step', 'password'),
  url.searchParams.set('u', payload.userId.toString())
  url.searchParams.set('t', redefineToken)
  if(payload.redirect){
    url.searchParams.set('next', payload.redirect)
  }
  return Result.result({
    url: url.toString(),
  })
}

