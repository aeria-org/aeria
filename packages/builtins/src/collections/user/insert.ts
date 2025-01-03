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
  if( 'password' in payload.what && typeof payload.what.password === 'string' ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return originalInsert(payload, context)
}

