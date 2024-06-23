import type { Context, SchemaWithId, CountPayload } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { Result } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import { traverseDocument } from '../../collection/index.js'

export const count = async <TContext extends Context>(
  payload: CountPayload<SchemaWithId<TContext['description']>>,
  context: TContext extends Context<any>
    ? TContext
    : never,
) => {
  const security = useSecurity(context)
  const { filters } = throwIfError(await security.beforeRead(payload))
  const { $text, ...filtersRest } = filters

  const traversedFilters = throwIfError(await traverseDocument(filtersRest, context.description, {
    autoCast: true,
    allowOperators: true,
  }))

  if( $text ) {
    const pipeline = []
    if( $text ) {
      pipeline.push({
        $match: {
          $text,
        },
      })
    }

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

