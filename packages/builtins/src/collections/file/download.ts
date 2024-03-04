import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { ObjectId } from 'mongodb'
import { left } from '@aeriajs/common'
import fs from 'fs'

export enum FileReadError {
  DocumentNotFound = 'DOCUMENT_NOT_FOUND',
  FileNotFound = 'FILE_NOT_FOUND',
}

export const download = async (
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
      filename: 1,
      mime: 1,
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
  if( range ) {
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
        'content-type': file.mime,
        'content-disposition': `${options.includes('download')
          ? 'attachment; '
          : ''}filename=${encodeURI(file.filename)}`,
      })
    }

    return fs.createReadStream(file.absolute_path, {
      start,
      end,
    })
  }

  if( !payload.noHeaders ) {
    context.response.writeHead(200, {
      'content-type': file.mime,
      'content-disposition': `${options.includes('download')
        ? 'attachment; '
        : ''}filename=${encodeURI(file.filename)}`,
    })
  }

  return fs.createReadStream(file.absolute_path)
}

