import type { Context, SchemaWithId, CountPayload } from '@aeriajs/types'
import { useSecurity, applyReadMiddlewares } from '@aeriajs/security'
import { Result } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { traverseDocument } from '../collection/index.js'

export type CountOptions = {
  bypassSecurity?: boolean
}

const internalCount = async <TContext extends Context>(
  payload: CountPayload<SchemaWithId<TContext['description']>>,
  context: Context,
) => {
  const { filters = {} } = payload
  const $text = '$text' in filters
    ? filters.$text
    : undefined

  if( '$text' in filters ) {
    delete filters.$text
  }

  const traversedFilters = throwIfError(await traverseDocument(filters, context.description, {
    autoCast: true,
    allowOperators: true,
    context,
  }))

  if( $text ) {
    const pipeline = []
    pipeline.push({
      $match: {
        $text,
      },
    })

    pipeline.push({
      $match: traversedFilters,
    })

    pipeline.push({
      $count: 'total',
    })

    const result = await context.collection.model.aggregate(pipeline).next()
    return Result.result(result
      ? result.total
      : 0)
  }

  return Result.result(await context.collection.model.countDocuments(traversedFilters))
}

export const count = async <TContext extends Context>(
  payload: CountPayload<SchemaWithId<TContext['description']>>,
  context: TContext extends Context
    ? TContext
    : never,
  options: CountOptions = {},
) => {
  if( options.bypassSecurity ) {
    return internalCount(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    return Result.error(error)
  }

  return applyReadMiddlewares(securedPayload, context, internalCount)
}

