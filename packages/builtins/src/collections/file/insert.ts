import type { Context, SchemaWithId, PackReferences } from '@aeriajs/types'
import type { description } from './description.js'
import { createHash } from 'crypto'
import { writeFile, unlink } from 'fs/promises'
import { insert as originalInsert } from '@aeriajs/core'

export const insert = async (
  payload: {
    what: { content: string } & Pick<PackReferences<SchemaWithId<typeof description>>,
      | '_id'
      | 'name'
      | 'owner'
      | 'absolute_path'
    >
  },
  context: Context<typeof description>,
) => {
  if( !context.token.authenticated ) {
    throw new Error('')
  }

  const { content, ...what } = Object.assign({}, payload.what)
  if( context.token.sub ) {
    what.owner = context.token.sub
  }

  const extension = what.name.split('.').at(-1)

  if( !context.config.storage ) {
    throw new Error('config.storage is not set')
  }

  const tempPath = context.config.storage.tempFs || context.config.storage.fs
  if( !tempPath ) {
    throw new Error('config.storage.fs and config.storage.tempFs are not set')
  }

  if( !extension ) {
    throw new Error('filename lacks extension')
  }

  const oldFile = await context.collection.model.findOne(
    {
      _id: payload.what._id,
    },
    {
      projection: {
        absolute_path: 1,
      },
    },
  )

  if( oldFile && oldFile.absolute_path ) {
    await unlink(oldFile.absolute_path).catch(console.trace)
  }

  const filenameHash = createHash('sha1')
    .update(what.name + Date.now())
    .digest('hex')

  what.absolute_path = `${tempPath}/${filenameHash}.${extension}`
  await writeFile(what.absolute_path, Buffer.from(content.split(',').at(-1)!, 'base64'))

  return originalInsert({
    ...payload,
    what,
  }, context)
}

