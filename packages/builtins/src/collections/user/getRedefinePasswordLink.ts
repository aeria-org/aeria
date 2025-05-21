import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { Result, HTTPStatus, resultSchema, functionSchemas, endpointErrorSchema, defineContract } from '@aeriajs/types'
import { RedefinePasswordError } from './redefinePassword.js'
import { getActivationToken } from './getActivationLink.js'

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
      httpStatus: [HTTPStatus.Forbidden],
      code: [RedefinePasswordError.UserNotActive],
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

  const { error, result: user } = await context.collections.user.functions.get({
    filters: {
      _id: payload.userId,
    },
    project: ['active'],
  })

  if( error ) {
    return Result.error(error)
  }
  if( !user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: RedefinePasswordError.UserNotActive,
    })
  }

  const redefineToken = await getActivationToken(payload.userId.toString(), context)

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
