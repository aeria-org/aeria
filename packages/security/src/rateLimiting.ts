import type { Context, Description, RateLimitingParams } from '@aeriajs/types'
import { left, right } from '@aeriajs/common'

export enum RateLimitingErrors {
  Unauthenticated = 'UNAUTHENTICATED',
  LimitReached = 'LIMIT_REACHED',
}

const getUser = <TDescription extends Description>(context: Context<TDescription>): Promise<Record<string, any> | null> => {
  if( !context.token.authenticated ) {
    throw new Error()
  }

  return context.collections.user.model.findOne(
    {
      _id: context.token.sub,
    },
    {
      resources_usage: 1,
    },
  )
}

export const limitRate = async <TDescription extends Description>(
  context: Context<TDescription>,
  params: RateLimitingParams,
) => {
  let user: Awaited<ReturnType<typeof getUser>>

  if( !context.token.authenticated || !(user = await getUser(context)) ) {
    return left(RateLimitingErrors.Unauthenticated)
  }

  const {
    increment = 1,
    limit,
    scale,
  } = params

  const payload = {
    $inc: {
      hits: increment,
    },
    $set: {},
  }

  const usage = user.resources_usage?.get(context.functionPath)
  if( !usage ) {
    const entry = await context.collections.resourceUsage.model.insertOne({
      hits: increment,
    })

    await context.collections.user.model.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          [`resources_usage.${context.functionPath}`]: entry.insertedId,
        },
      },
    )

    return right(null)
  }

  if( scale && (new Date().getTime() / 1000 - usage.updated_at!.getTime() / 1000 < scale) ) {
    return left(RateLimitingErrors.LimitReached)
  }

  if( limit && (usage.hits! % limit === 0) ) {
    payload.$set = {
      last_maximum_reach: new Date(),
    }
  }

  await context.collections.resourceUsage.model.updateOne(
    {
      _id: usage._id,
    },
    payload,
  )

  return right(null)
}
