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

  const sanitizedPayload = !options.bypassSecurity
    ? throwIfError(await security.beforeRead(payload))
    : payload

  const {
    limit = context.config.paginationLimit!,
    sort,
    project = [],
    offset = 0,
  } = sanitizedPayload

  const filters = sanitizedPayload.filters || {}
  const $text = sanitizedPayload.filters && '$text' in sanitizedPayload.filters
    ? sanitizedPayload.filters.$text
    : undefined

  if( '$text' in filters ) {
    delete filters.$text
  }

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

  if( Object.keys(filters).length > 0 ) {
    pipeline.push({
      $match: throwIfError(await traverseDocument(filters, context.description, {
        autoCast: true,
        allowOperators: true,
      })),
    })
  }

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
    project: sanitizedPayload.populate
      ? <string[]>sanitizedPayload.populate
      : project,
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

