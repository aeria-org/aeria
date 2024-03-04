import type { Context, SchemaWithId, GetPayload } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { useSecurity } from '@aeriajs/security'
import { unsafe } from '@aeriajs/common'
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

export const get = async <
  TContext extends Context,
  TDocument = SchemaWithId<TContext['description']>,
>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext extends Context<any>
    ? TContext
    : never,
  options?: GetOptions,
) => {
  const security = useSecurity(context)

  const {
    filters = {},
    project = [],
  } = !options?.bypassSecurity
    ? unsafe(await security.beforeRead(payload))
    : payload

  const pipeline: Document[] = []
  const references = await getReferences(context.description.properties, {
    memoize: context.description.$id,
  })

  pipeline.push({
    $match: unsafe(await traverseDocument(filters, context.description, {
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
    project: payload.populate || project,
    properties: context.description.properties,
  }))

  const result = await context.collection.model.aggregate(pipeline).next()
  if( !result ) {
    return null
  }

  return fill(unsafe(await traverseDocument(result, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
    recurseDeep: true,
  })), context.description) as TDocument
}

