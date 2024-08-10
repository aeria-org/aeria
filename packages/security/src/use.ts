import type { Context, Description } from '@aeriajs/types'
import type { CollectionHookReadPayload, CollectionHookWritePayload } from './types.js'
import { Result } from '@aeriajs/types'
import { iterableMiddlewares } from './middleware.js'
import {
  checkImmutabilityWrite,
  checkOwnershipRead,
  checkOwnershipWrite,
  checkPagination,
} from './index.js'

export const useSecurity = <TDescription extends Description>(context: Context<TDescription>) => {
  const beforeRead = async <TPayload extends Partial<CollectionHookReadPayload>>(payload?: TPayload) => {
    const newPayload = Object.assign({
      filters: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    const middlewares = [checkPagination]

    if( context.description.owned !== 'on-write' ) {
      middlewares.push(checkOwnershipRead)
    }

    const start = iterableMiddlewares<
      Result.Either<unknown, TPayload & CollectionHookReadPayload>,
      typeof props
    >(middlewares)

    return start(props, Result.result(newPayload), context)
  }

  const beforeWrite = async <TPayload extends CollectionHookWritePayload>(payload?: TPayload) => {
    const newPayload = Object.assign({
      what: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    const start = iterableMiddlewares<
      Result.Either<unknown, TPayload>,
      typeof props
    >([
      checkOwnershipWrite,
      checkImmutabilityWrite,
    ])

    return start(props, Result.result(newPayload), context)
  }

  return {
    beforeRead,
    beforeWrite,
  }
}

