import type { Context, SchemaWithId, GetAllPayload } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { useSecurity, applyReadMiddlewares } from '@aeriajs/security'
import { Result } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import {
  traverseDocument,
  normalizeProjection,
  getReferences,
  buildLookupPipeline,
} from '../collection/index.js'

export type GetAllOptions = {
  bypassSecurity?: boolean
  noDefaultLimit?: boolean
}

const internalGetAll = async <TContext extends Context>(
  payload: GetAllPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  const {
    limit,
    sort,
    project,
    offset = 0,
  } = payload

  const filters = payload.filters
    ? Object.assign({}, payload.filters)
    : {}

  const $text = payload.filters && '$text' in payload.filters
    ? payload.filters.$text
    : undefined

  if( '$text' in filters ) {
    delete filters.$text
  }

  const pipeline: Document[] = []
  const refMap = await getReferences(context.description.properties, {
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

  if( limit ) {
    pipeline.push({
      $limit: limit,
    })
  }

  if( project ) {
    const projection = normalizeProjection(project, context.description)
    if( projection ) {
      pipeline.push({
        $project: projection,
      })
    }
  }

  pipeline.push(...buildLookupPipeline(refMap, {
    memoize: context.description.$id,
    project: payload.populate
      ? <string[]>payload.populate
      : project,
  }))

  if( Object.keys(refMap).length > 0 && preferredSort ) {
    pipeline.push({
      $sort: preferredSort,
    })
  }

  const result = await context.collection.model.aggregate<SchemaWithId<TContext['description']>>(pipeline).toArray()
  const documents: SchemaWithId<TContext['description']>[] = []

  for( const doc of result ) {
    documents.push(throwIfError(await traverseDocument(doc, context.description, {
      context,
      getters: true,
      fromProperties: true,
      recurseReferences: true,
      recurseDeep: true,
    })))
  }

  return Result.result(documents)
}

export const getAll = async <TContext extends Context>(
  payload: GetAllPayload<SchemaWithId<TContext['description']>> | undefined,
  context: TContext,
  options: GetAllOptions = {},
) => {
  if( !payload ) {
    return internalGetAll({}, context)
  }
  if( options.bypassSecurity ) {
    return internalGetAll(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    return Result.error(error)
  }

  if( !options.noDefaultLimit ) {
    securedPayload.limit ||= context.config.defaultPaginationLimit
  }

  return applyReadMiddlewares(securedPayload, context, internalGetAll)
}

