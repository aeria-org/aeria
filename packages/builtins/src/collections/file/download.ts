import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { defineExposedFunction, ObjectId } from '@aeriajs/core'
import { left } from '@aeriajs/common'
import * as fs from 'fs'

export enum FileReadError {
  DocumentNotFound = 'DOCUMENT_NOT_FOUND',
  FileNotFound = 'FILE_NOT_FOUND',
}

export const download = defineExposedFunction(async (
  payload: {
    fileId: string
    options: readonly (
      | 'picture'
      | 'download'
    )[]
    noHeaders?: boolean
  },
  context: Context<typeof description>,
) => {
  const { fileId, options = [] } = payload
  const file = await context.collection.model.findOne({
    _id: new ObjectId(fileId),
  }, {
    projection: {
      absolute_path: 1,
      name: 1,
      type: 1,
    },
  })

  if( !file ) {
    if( !payload.noHeaders ) {
      context.response.writeHead(404, {
        'content-type': 'application/json',
      })
    }
    return left(FileReadError.DocumentNotFound)
  }

  let stat: fs.StatsBase<number>
  try {
    stat = await fs.promises.stat(file.absolute_path)
  } catch( e ) {
    context.response.writeHead(404, {
      'content-type': 'application/json',
    })
    return left(FileReadError.FileNotFound)
  }

  const range = context.request.headers.range
  if( typeof range === 'string' ) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0])
    const end = parts[1]
      ? parseInt(parts[1])
      : stat.size - 1

    const chunkSize = (end - start) + 1

    if( !payload.noHeaders ) {
      context.response.writeHead(206, {
        'accept-ranges': 'bytes',
        'content-range': `bytes ${start}-${end}/${stat.size}`,
        'content-length': chunkSize,
        'content-type': file.type,
        'content-disposition': `${options.includes('download')
          ? 'attachment; '
          : ''}name=${encodeURI(file.name)}`,
      })
    }

    return fs.createReadStream(file.absolute_path, {
      start,
      end,
    })
  }

  if( !payload.noHeaders ) {
    context.response.writeHead(200, {
      'content-type': file.type,
      'content-disposition': `${options.includes('download')
        ? 'attachment; '
        : ''}name=${encodeURI(file.name)}`,
    })
  }

  return fs.createReadStream(file.absolute_path)
})

