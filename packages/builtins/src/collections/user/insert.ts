import type { Context, SchemaWithId, InsertPayload } from '@aeriajs/types'
import type { description } from './description'
import { insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcrypt'

export const insert = async <TInsertPayload extends InsertPayload<SchemaWithId<typeof description>> = InsertPayload<SchemaWithId<typeof description>>>(
  payload: NoInfer<TInsertPayload>,
  context: Context<typeof description>,
) => {
  if( payload.what.password ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return originalInsert(payload, context)
}

