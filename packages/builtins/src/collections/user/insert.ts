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
    return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthenticationError})
  }
  if(!mutableProperties){
    return context.error(HTTPStatus.InternalServerError, {code:ACError.InsecureOperator})
  }
  if( 'password' in payload.what && typeof payload.what.password === 'string' ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }
  if(('email' in payload.what)){
    if(!(typeof payload.what.email === 'string')){
      return context.error(HTTPStatus.UnprocessableContent, {code:ACError.MalformedInput})
    }
    const existing = await context.collections.user.model.findOne({
      email: payload.what.email
    })
    if(existing && existing.email !== context.token.userinfo.email){
      const {error: noUser, result:user} = await context.collections.user.functions.get({
        filters:{
          _id: context.token.sub
        }
      })
      if(noUser){
        return context.error(HTTPStatus.Forbidden, {code:ACError.ResourceNotFound})
      }
      if(existing.email !== user.email && !context.token.roles.includes('root')){
        return context.error(HTTPStatus.Forbidden, {code:ACError.MalformedInput})
      }
    }
  }

  if(!context.token.roles.includes('root')){
    const whatPropKeyArray = Object.keys(payload.what).filter(prop => prop !== "_id")
    if(whatPropKeyArray.some((prop:any) => !(mutableProperties.includes(prop)))){
      return context.error(HTTPStatus.BadRequest, {code:ACError.MalformedInput})
    }
    if('_id' in payload.what){
      if(!context.token.sub){ 
        return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthenticationError})
      }
      if(payload.what._id !== context.token.sub.toString()){
        return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthorizationError})
      }
      if('roles' in payload.what){
        payload.what.roles = context.token.roles
      }
      
      return originalInsert(payload, context)
    }
    return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthorizationError})
  }
  return originalInsert(payload, context)
}

