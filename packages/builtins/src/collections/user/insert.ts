import type { Context, SchemaWithId, PackReferences } from '@aeriajs/types'
import type { description } from './description'
import * as bcrypt from 'bcrypt'
import { functions } from '@aeriajs/api'

export const insert = async (
  payload: {
    what: Omit<PackReferences<SchemaWithId<typeof description>>, 'roles'>
  },
  context: Context,
) => {
  if( payload.what.password ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return functions.insert(payload, context)
}

