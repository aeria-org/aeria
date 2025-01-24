import type { description } from './description.js'
import { HTTPStatus, ACError, type Context, type SchemaWithId, type PackReferences } from '@aeriajs/types'
import { insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcrypt'

export const editProfile = async (payload: Partial<PackReferences<SchemaWithId<typeof description>>>, context: Context<typeof description>) => {
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

