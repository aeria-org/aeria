import type { Context, ContractToFunction } from '@aeriajs/types'
import { HTTPStatus, ACError, defineContract, endpointErrorSchema } from '@aeriajs/types'
import { ObjectId } from '@aeriajs/core'
import * as fs from 'node:fs'
import { type description } from './description.js'

export const DownloadError = {
  RangeNotSatisfiable: 'RANGE_NOT_SATISFIABLE',
} as const

export const downloadContract = defineContract({
  payload: {
    type: 'object',
    required: [
      'fileId',
    ],
    properties: {
      fileId: {
        type: 'string',
      },
      options: {
        type: 'array',
        items: {
          enum: [
            'picture',
            'download',
          ],
        },
      },
      noHeaders: {
        type: 'boolean',
      },
    },
  },
  response: [
    endpointErrorSchema({
      httpStatus: [
        HTTPStatus.NotFound,
        HTTPStatus.RangeNotSatisfiable,
      ],
      code: [
        ACError.ResourceNotFound,
        DownloadError.RangeNotSatisfiable,
      ],
    }),
    {
      type: 'object',
      additionalProperties: true,
    },
  ],
})

export const download: ContractToFunction<typeof downloadContract, Context<typeof description>> = async (payload, context) => {
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
      context.response.writeHead(HTTPStatus.NotFound, {
        'content-type': 'application/json',
      })
    }
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  let stat: fs.StatsBase<number>
  try {
    stat = await fs.promises.stat(file.absolute_path)
  } catch( e ) {
    context.response.writeHead(404, {
      'content-type': 'application/json',
    })
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const range = context.request.headers.range
  if( typeof range === 'string' ) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0])
    const end = parts[1]
      ? parseInt(parts[1])
      : stat.size - 1

    if( start >= stat.size || end >= stat.size ) {
      context.response.writeHead(HTTPStatus.RangeNotSatisfiable, {
        'content-type': 'application/json',
        'content-range': `bytes */${stat.size}`,
      })
      return context.error(HTTPStatus.RangeNotSatisfiable, {
        code: DownloadError.RangeNotSatisfiable,
      })
    }

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
    context.response.writeHead(HTTPStatus.Ok, {
      'content-type': file.type,
      'content-disposition': `${options.includes('download')
        ? 'attachment; '
        : ''}name=${encodeURI(file.name)}`,
    })
  }

  return fs.createReadStream(file.absolute_path)
}

