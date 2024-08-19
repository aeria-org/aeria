import type { Context, Description, ACError } from '@aeriajs/types'
import type { CollectionHookReadPayload, CollectionHookWritePayload } from './types.js'
import { Result } from '@aeriajs/types'
import { iterableMiddlewares } from './middleware.js'
import {
  checkImmutabilityWrite,
  checkOwnershipRead,
  checkOwnershipWrite,
  checkPagination,
} from './middlewares/index.js'

export const useSecurity = <TDescription extends Description>(context: Context<TDescription>) => {
  const secureReadPayload = async <TPayload extends Partial<CollectionHookReadPayload>>(payload?: TPayload) => {
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
      Result.Either<
        | ACError.OwnershipError
        | ACError.InvalidLimit,
        TPayload & CollectionHookReadPayload
      >,
      typeof props
    >(middlewares)

    return start(props, Result.result(newPayload), context)
  }

  const secureWritePayload = async <TPayload extends CollectionHookWritePayload>(payload?: TPayload) => {
    const newPayload = Object.assign({
      what: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    const start = iterableMiddlewares<
      Result.Either<
        | ACError.OwnershipError
        | ACError.ResourceNotFound
        | ACError.TargetImmutable,
        TPayload
      >,
      typeof props
    >([
      checkOwnershipWrite,
      checkImmutabilityWrite,
    ])

    return start(props, Result.result(newPayload), context)
  }

  return {
    secureReadPayload,
    secureWritePayload,
  }
}

