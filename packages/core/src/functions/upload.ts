import { Result, ACError, HTTPStatus, type Context } from '@aeriajs/types'
import { validator } from '@aeriajs/validation'
import * as path from 'node:path'
import { createWriteStream } from 'node:fs'
import { createHash } from 'node:crypto'

export const [FileMetadata, validateFileMetadata] = validator({
  type: 'object',
  required: ['name'],
  properties: {
    name: {
      type: 'string',
    },
    format: {
      enum: [
        'raw',
        'base64',
      ],
    },
  },
})

export const [UploadHeaders, validateUploadHeaders] = validator({
  type: 'object',
  additionalProperties: true,
  required: [
    'x-stream-request',
    'content-type',
  ],
  properties: {
    'x-stream-request': {
      const: '1',
    },
    'content-type': {
      type: 'string',
    },
  },
})

const streamToFs = (metadata: typeof FileMetadata, context: Context) => {
  const nameHash = createHash('sha1')
    .update(metadata.name + Date.now())
    .digest('hex')

  const extension = metadata.name.includes('.')
    ? metadata.name.split('.').at(-1)
    : 'bin'

  const tmpPath = context.config.storage
    ? context.config.storage.tempFs || context.config.storage.fs
    : null

  if( !tmpPath ) {
    throw new Error()
  }

  const absolutePath = path.join(tmpPath, `${nameHash}.${extension}`)

  return new Promise<string>(async (resolve, reject) => {
    const stream = createWriteStream(absolutePath)
    stream.on('close', () => resolve(absolutePath))
    stream.on('error', (error) => reject(error))

    switch( metadata.format ) {
      case undefined:
      case 'raw': {
        stream.on('open', () => context.request.pipe(stream))
        break
      }
      case 'base64': {
        stream.write(Buffer.from(Buffer.concat(await Array.fromAsync(context.request)).toString(), 'base64'))
        stream.close()
        break
      }
    }

  })
}

export const upload = async <TContext extends Context>(_props: unknown, context: TContext) => {
  const { error: headersError } = validateUploadHeaders(context.request.headers)

  if( headersError ) {
    return context.error(HTTPStatus.BadRequest, {
      code: ACError.MalformedInput,
      details: headersError,
    })
  }

  const { error, result: metadata } = validateFileMetadata(context.request.query)
  if( error ) {
    return context.error(HTTPStatus.BadRequest, {
      code: ACError.MalformedInput,
      details: error,
    })
  }

  const path = await streamToFs(metadata, context)
  const file = await context.collections.tempFile.model.insertOne({
    created_at: new Date(),
    absolute_path: path,
    size: context.request.headers['content-length'],
    type: context.request.headers['content-type'],
    collection: context.description.$id,
    name: metadata.name,
  })

  return Result.result({
    tempId: file.insertedId,
  })
}

