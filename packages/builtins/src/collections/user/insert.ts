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
  if(!context.token.sub){ 
    return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthenticationError})
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
      if(existing.email !== user.email){
        return context.error(HTTPStatus.Forbidden, {code:ACError.OwnershipError})
      }
    }
  }
  if(!context.token.roles.includes('root')){
    if('_id' in payload.what){
      if(payload.what._id !== context.token.sub.toString()){
        console.log('different ID')
        return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthorizationError})
      }
      if('roles' in payload.what){
        payload.what.roles = context.token.roles
      }
      
      return originalInsert(payload, context)
    }
    console.log('not root')
    return context.error(HTTPStatus.Unauthorized, {code:ACError.AuthorizationError})
  }
  return originalInsert(payload, context)
}

