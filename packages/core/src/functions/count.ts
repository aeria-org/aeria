import type { Context, SchemaWithId, CountPayload, CountReturnType } from '@aeriajs/types'
import { useSecurity, applyReadMiddlewares } from '@aeriajs/security'
import { Result, HTTPStatus } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { traverseDocument } from '../collection/index.js'

export type CountOptions = {
  bypassSecurity?: boolean
  noRegExpEscaping?: boolean
}

const internalCount = async <TContext extends Context>(
  payload: CountPayload<SchemaWithId<TContext['description']>>,
  context: Context,
  options: CountOptions,
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
    noRegExpEscaping: options.noRegExpEscaping,
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
): Promise<CountReturnType> => {
  if( options.bypassSecurity ) {
    return internalCount(payload, context, options)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    return context.error(HTTPStatus.Forbidden, {
      code: error,
    })
  }

  return applyReadMiddlewares(securedPayload, context, (payload, context) => {
    return internalCount(payload, context, options)
  })
}

