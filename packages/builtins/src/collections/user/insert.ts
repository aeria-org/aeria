import type { Context, SchemaWithId, InsertPayload, Description } from '@aeriajs/types'
import type { description } from './description.js'
import { insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcrypt'

export const insert = async <
  TDescription extends Description = typeof description,
  TInsertPayload extends InsertPayload<SchemaWithId<TDescription>> = InsertPayload<SchemaWithId<TDescription>>,
>(
  payload: NoInfer<TInsertPayload>,
  context: Context<TDescription>,
) => {
  if( 'password' in payload.what && typeof payload.what.password === 'string' ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return originalInsert(payload, context)
}


