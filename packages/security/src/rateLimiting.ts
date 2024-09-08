import type { RouteContext, RateLimitingParams } from '@aeriajs/types'
import { Result, HTTPStatus, RateLimitingError } from '@aeriajs/types'

const buildEntryFilter = (
  params: RateLimitingParams,
  context: RouteContext,
) => {
  if( params.strategy === 'ip' ) {
    const address = context.response.socket!.remoteAddress
    return {
      address,
    }
  }

  if( !context.token.authenticated ) {
    throw new Error('user is not authenticated')
  }

  return {
    user: context.token.sub,
  }
}

export const getOrCreateUsageEntry = async (
  params: RateLimitingParams,
  context: RouteContext,
) => {
  const filters = buildEntryFilter(params, context)
  const entry = await context.collections.resourceUsage.model.findOneAndUpdate(
    filters,
    {
      $setOnInsert: {
        usage: {},
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
    },
  )

  if( !entry ) {
    throw new Error('there was an error creating the entry')
  }

  return entry
}

export const limitRate = async (
  params: RateLimitingParams,
  context: RouteContext,
) => {
  const { increment = 1 } = params

  const entry = await getOrCreateUsageEntry(params, context)

  const pathname = context.request.url.replace(new RegExp(`^${context.config.baseUrl}`), '')
  const resourceName = new URL(`http://0.com${pathname}`).pathname

  const resource = entry.usage[resourceName]
  if( resource ) {
    if( 'scale' in params ) {
      const now = new Date()
      if( params.scale > now.getTime() / 1000 - resource.last_reach.getTime() / 1000 ) {
        return context.error(HTTPStatus.TooManyRequests, {
          code: RateLimitingError.LimitReached,
        })
      }
    }
  }

  const newEntry = await context.collections.resourceUsage.model.findOneAndUpdate(
    {
      _id: entry._id,
    },
    {
      $inc: {
        [`usage.${resourceName}.hits`]: 1,
        [`usage.${resourceName}.points`]: increment,
      },
      $set: {
        [`usage.${resourceName}.last_reach`]: new Date(),
        [`usage.${resourceName}.last_maximum_reach`]: new Date(),
      },
    },
    {
      returnDocument: 'after',
    },
  )

  if( !newEntry ) {
    throw new Error()
  }

  return Result.result(newEntry.usage[resourceName])
}

