import type { Context, SchemaWithId, CountPayload } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { unsafe } from '@aeriajs/common'
import { traverseDocument } from '../collection/index.js'

export const count = async <TContext extends Context>(
  payload: CountPayload<SchemaWithId<Context['description']>>,
  context: TContext extends Context<any>
    ? TContext
    : never,
) => {
  const security = useSecurity(context)
  const { filters } = unsafe(await security.beforeRead(payload))
  const { $text, ...filtersRest } = filters

  const traversedFilters = unsafe(await traverseDocument(filtersRest, context.description, {
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
    return result
      ? result.total
      : 0
  }

  return context.collection.model.countDocuments(traversedFilters)
}

