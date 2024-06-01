import type { Context, SchemaWithId, GetPayload, GetReturnType } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { HTTPStatus, ACError } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { throwIfLeft } from '@aeriajs/common'
import {
  traverseDocument,
  normalizeProjection,
  getReferences,
  buildLookupPipeline,
  fill,
} from '../../collection/index.js'

export type GetOptions = {
  bypassSecurity?: boolean
}

export const get = async <TContext extends Context>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext extends Context<any>
    ? TContext
    : never,
  options?: GetOptions,
): Promise<GetReturnType<TContext['description']>> => {
  const security = useSecurity(context)

  const {
    filters = {},
    project = [],
  } = !options?.bypassSecurity
    ? throwIfLeft(await security.beforeRead(payload))
    : payload

  if( Object.keys(filters).length === 0 ) {
    throw new Error('no filters were passed')
  }

  const pipeline: Document[] = []
  const references = await getReferences(context.description.properties, {
    memoize: context.description.$id,
  })

  pipeline.push({
    $match: throwIfLeft(await traverseDocument(filters, context.description, {
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
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  return fill(throwIfLeft(await traverseDocument(result, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
    recurseDeep: true,
  })), context.description)
}

