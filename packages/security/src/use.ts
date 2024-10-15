import type { Context, Description, CollectionReadPayload, CollectionWritePayload } from '@aeriajs/types'
import { Result } from '@aeriajs/types'
import { ReadMiddlewareReturn, WriteMiddlewareReturn } from './types.js'
import { iterableMiddlewares } from './middleware/index.js'
import {
  checkImmutabilityWrite,
  checkOwnershipRead,
  checkOwnershipWrite,
  checkPagination,
} from './middlewares/index.js'

export const useSecurity = <TDescription extends Description>(context: Context<TDescription>) => {
  const secureReadPayload = async <TPayload extends Partial<CollectionReadPayload>>(payload?: TPayload) => {
    const newPayload = Object.assign({
      filters: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    const start = iterableMiddlewares<
      Result.Result<typeof props>,
      ReadMiddlewareReturn<typeof props>
    >([
      checkPagination,
      checkOwnershipRead,
    ])

    const { error, result } = await start(Result.result(props), context)
    if( error ) {
      return Result.error(error)
    }

    return Result.result(result.payload)
  }

  const secureWritePayload = async <TPayload extends CollectionWritePayload>(payload?: TPayload) => {
    const newPayload = Object.assign({
      what: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    const start = iterableMiddlewares<
      Result.Result<typeof props>,
      WriteMiddlewareReturn<typeof props>
    >([
      checkOwnershipWrite,
      checkImmutabilityWrite,
    ])

    const { error, result } = await start(Result.result(props), context)
    if( error ) {
      return Result.error(error)
    }

    return Result.result(result.payload)
  }

  return {
    secureReadPayload,
    secureWritePayload,
  }
}

