import type { Context, SchemaWithId, PackReferences } from '@aeriajs/types'
import type { description } from './description'
import { defineFunctionAttributes, insert as originalInsert } from '@aeriajs/core'
import * as bcrypt from 'bcrypt'

export const insert = async (
  payload: {
    what: Omit<PackReferences<SchemaWithId<typeof description>>, 'roles'>
  },
  context: Context<typeof description>,
) => {
  if( payload.what.password ) {
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return originalInsert(payload, context)
}

defineFunctionAttributes(insert, {
  exposed: true,
})

