import type { Context, ContractToFunction } from '@aeriajs/types'
import { HTTPStatus, ACError, defineContract, functionSchemas, resultSchema } from '@aeriajs/types'
import { insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcryptjs'
import { description } from './description.js'

export const editProfileContract = defineContract({
  payload: {
    type: 'object',
    required: [],
    properties: {
      ...description.properties,
      picture_file: {
        type: 'string',
        format: 'objectid',
      }
    },
  },
  response: [
    functionSchemas.insertError(),
    resultSchema({
      $ref: 'user',
    }),
  ],
})

export const editProfile: ContractToFunction<typeof editProfileContract, Context<typeof description>> = async (payload, context)=> {
  const mutableProperties = context.config.security.mutableUserProperties
  if( !context.token.sub ){
    throw new Error
  }

  const user = await context.collections.user.model.findOne({
    _id: context.token.sub,
  })

  if( !user ){
    throw new Error
  }

  if( payload.password && typeof payload.password === 'string' ) {
    payload.password = await bcrypt.hash(payload.password, 10)
  }

  const whatPropKeyArray = Object.keys(payload).filter((prop) => prop !== '_id')
  const hasImmutableProps = whatPropKeyArray.some((prop) => !(mutableProperties.includes(prop as typeof mutableProperties[number])))

  if(hasImmutableProps){
    return context.error(HTTPStatus.Forbidden, {
      code: ACError.TargetImmutable,
    })
  }

  return originalInsert({
    what: {
      ...payload,
      _id: context.token.sub,
    },
  }, context)
}

