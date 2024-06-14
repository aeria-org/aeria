import { Result, ACError, HTTPStatus, type Context } from '@aeriajs/types'
import { getCollection } from '@aeriajs/entrypoint'
import { validate, validator } from '@aeriajs/validation'
import * as path from 'path'
import { createWriteStream } from 'fs'
import { createHash } from 'crypto'

const [FileMetadata, validateFileMetadata] = validator({
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
  },
})

const streamToFs = (metadata: typeof FileMetadata, context: Context) => {
  const nameHash = createHash('sha1')
    .update(metadata.name + Date.now())
    .digest('hex')

  const extension = metadata.name.includes('.')
    ? metadata.name.split('.').pop()
    : 'bin'

  const tmpPath = context.config.storage
    ? context.config.storage.tempFs || context.config.storage.fs
    : null

  if( !tmpPath ) {
    throw new Error()
  }

  const absolutePath = path.join(tmpPath, `${nameHash}.${extension}`)

  return new Promise<string>((resolve, reject) => {
    const stream = createWriteStream(absolutePath)

    stream.on('open', () => context.request.nodeRequest.pipe(stream))
    stream.on('close', () => resolve(absolutePath))
    stream.on('error', (error) => reject(error))
  })
}

export const upload = async <TContext extends Context>(_props: unknown, context: TContext) => {
  const tempFileCollection = await getCollection('tempFile')
  if( !tempFileCollection ) {
    throw new Error('The "tempFile" collection is absent, yet it is required to upload files.')
  }

  const { error: headersError } = validate(context.request.headers, {
    type: 'object',
    properties: {
      'x-stream-request': {
        const: '1',
      },
      'content-type': {
        type: 'string',
      },
    },
  }, {
    extraneous: true,
  })

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

