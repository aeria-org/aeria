import type { Context, SchemaWithId, GetAllPayload } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { useSecurity } from '@aeriajs/security'
import { Result } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import {
  traverseDocument,
  normalizeProjection,
  getReferences,
  buildLookupPipeline,
  fill,
} from '../../collection/index.js'

export type GetAllOptions = {
  bypassSecurity?: boolean
}

export const getAll = async <TContext extends Context>(
  _payload: GetAllPayload<SchemaWithId<TContext['description']>> | undefined,
  context: TContext,
  options: GetAllOptions = {},
) => {
  const security = useSecurity(context)
  const payload = _payload || {}

  const {
    filters = {},
    limit = context.config.paginationLimit!,
    sort,
    project = [],
    offset = 0,
  } = !options.bypassSecurity
    ? throwIfError(await security.beforeRead(payload))
    : payload

  const { $text, ...filtersRest } = filters

  const pipeline: Document[] = []
  const references = await getReferences(context.description.properties, {
    memoize: context.description.$id,
  })

  if( $text ) {
    pipeline.push({
      $match: {
        $text,
      },
    })
  }

  const preferredSort = sort
    ? sort
    : context.description.timestamps !== false
      ? {
        _id: -1,
      }
      : null

  if( preferredSort ) {
    pipeline.push({
      $sort: preferredSort,
    })
  }

  if( Object.keys(filtersRest).length > 0 ) {
    pipeline.push({
      $match: throwIfError(await traverseDocument(filtersRest, context.description, {
        autoCast: true,
        allowOperators: true,
      })),
    })
  }

  console.log(JSON.stringify(pipeline, null,2))

  if( offset > 0 ) {
    pipeline.push({
      $skip: offset,
    })
  }

  pipeline.push({
    $limit: limit,
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

  if( Object.keys(references).length > 0 && preferredSort ) {
    pipeline.push({
      $sort: preferredSort,
    })
  }

  const result = await context.collection.model.aggregate(pipeline).toArray()
  const documents: SchemaWithId<TContext['description']>[] = []

  for( const document of result ) {
    documents.push(throwIfError(await traverseDocument(fill(document, context.description), context.description, {
      getters: true,
      fromProperties: true,
      recurseReferences: true,
      recurseDeep: true,
    })))
  }

  return Result.result(documents)
}

