import type { Context, SchemaWithId, GetPayload, GetReturnType } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { useSecurity } from '@aeriajs/security'
import { Result, HTTPStatus, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import {
  traverseDocument,
  normalizeProjection,
  getReferences,
  buildLookupPipeline,
  fill,
} from '../collection/index.js'

export type GetOptions = {
  bypassSecurity?: boolean
}

const internalGet = async <TContext extends Context>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
): Promise<GetReturnType<SchemaWithId<TContext['description']>>> => {
  const {
    filters = {},
    project = [],
  } = payload

  if( Object.keys(filters).length === 0 ) {
    return context.error(HTTPStatus.BadRequest, {
      code: ACError.MalformedInput,
    })
  }

  const pipeline: Document[] = []
  const references = await getReferences(context.description.properties, {
    memoize: context.description.$id,
  })

  pipeline.push({
    $match: throwIfError(await traverseDocument(filters, context.description, {
      autoCast: true,
      allowOperators: true,
    })),
  })

  const projection = normalizeProjection(project, context.description)
  if( projection ) {
    pipeline.push({
      $project: projection,
    })
  }

  pipeline.push(...await buildLookupPipeline(references, {
    memoize: context.description.$id,
    project: payload.populate
      ? <string[]>payload.populate
      : project,
    properties: context.description.properties,
  }))

  const doc = await context.collection.model.aggregate(pipeline).next()
  if( !doc ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const result = fill(throwIfError(await traverseDocument(doc, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
    recurseDeep: true,
  })), context.description)

  return Result.result(result)
}

export const get = async <TContext extends Context>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext extends Context<any>
    ? TContext
    : never,
  options: GetOptions = {},
) => {
  if( options.bypassSecurity ) {
    return internalGet(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    switch( error ) {
      case ACError.InvalidLimit: throw new Error
    }
  }
  return internalGet(securedPayload, context)
}

