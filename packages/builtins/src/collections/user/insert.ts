import type { Context, SchemaWithId, PackReferences } from '@aeriajs/types'
import type { description } from './description'
import { functions } from '@aeriajs/core'

export const insert = async (
  payload: {
    what: Omit<PackReferences<SchemaWithId<typeof description>>, 'roles'>
  },
  context: Context<typeof description>,
) => {
  if( payload.what.password ) {
    const bcrypt = await import('bcrypt')
    payload.what.password = await bcrypt.hash(payload.what.password, 10)
  }

  return functions.insert(payload, context)
}

