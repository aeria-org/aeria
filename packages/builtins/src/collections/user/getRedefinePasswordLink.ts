import type { Context, ContractToFunction } from '@aeriajs/types'
import type { description } from './description.js'
import { ObjectId } from 'mongodb'
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

  console.log(payload)

  const now = new Date()
  const user = await context.collections.user.model.findOneAndUpdate({
    _id: new ObjectId(payload.userId),
  }, {
    $set: {
      activation_timestamp: now,
    }
  }, {
    returnDocument: 'after',
    projection: {
      active: 1,
      password: 1,
    }
  })

  if( !user ) {
    return Result.error({
      httpStatus: HTTPStatus.NotFound,
      code: RedefinePasswordError.UserNotFound,
    })
  }

  if( !user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: RedefinePasswordError.UserNotActive,
    })
  }

  const token = await getActivationToken({
    _id: user._id,
    timestamp: now,
  }, context)

  const url = new URL(`${context.config.webPublicUrl}/user/redefine-password`)
  url.searchParams.set('step', 'password'),
  url.searchParams.set('u', payload.userId.toString())
  url.searchParams.set('t', token)
  if(payload.redirect){
    url.searchParams.set('next', payload.redirect)
  }
  return Result.result({
    url: url.toString(),
  })
}

