import { type Context, type SchemaWithId, type InsertPayload, type Description, HTTPStatus, ACError } from '@aeriajs/types'
import { insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcrypt'

export const insert = async <
  TDescription extends Description,
  TInsertPayload extends InsertPayload<SchemaWithId<TDescription>>,
>(
  payload: NoInfer<TInsertPayload>,
  context: Context<TDescription>,
) => {
  const mutableProperties = context.config.security.mutableUserProperties
  if(!context.token.authenticated){
    throw new Error('function not avaliable for unauthenticated users')
  }

  if( 'password' in payload.what && typeof payload.what.password === 'string' ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  if(!context.token.roles.includes('root')){
    if(!context.token.sub){
      throw new Error('function not avaliable for unauthenticated users')
    }

    const user = await context.collections.user.model.findOne({
      _id: context.token.sub,
    })

    if(!user){
      throw new Error('INVALID_TOKEN_USER_ID')
    }

    const whatPropKeyArray = Object.keys(payload.what).filter((prop) => prop !== '_id')
    const hasImmutableProps = whatPropKeyArray.some((prop) => !(mutableProperties.includes(prop as typeof mutableProperties[number])))

    if(hasImmutableProps){
      return context.error(HTTPStatus.Forbidden, {
        code: ACError.TargetImmutable,
      })
    }

    if('email' in payload.what){
      if(typeof payload.what.email !== 'string'){
        return context.error(HTTPStatus.UnprocessableContent, {
          code: ACError.MalformedInput,
        })
      }

      const userWithExistingEmail = await context.collections.user.model.findOne({
        email: payload.what.email,
      })

      if(userWithExistingEmail && userWithExistingEmail.email !== user.email){
        return context.error(HTTPStatus.Forbidden, {
          code: ACError.OwnershipError,
        })
      }
    }

    if('_id' in payload.what){
      if(payload.what._id !== context.token.sub.toString()){
        return context.error(HTTPStatus.Unauthorized, {
          code: ACError.AuthorizationError,
        })
      }

      return originalInsert(payload, context)
    }

    return context.error(HTTPStatus.Unauthorized, {
      code: ACError.AuthorizationError,
    })
  }

  return originalInsert(payload, context)
}

