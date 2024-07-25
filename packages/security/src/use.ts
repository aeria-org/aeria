import type { Context, Description, CollectionHook, CollectionHookProps } from '@aeriajs/types'
import type { CollectionHookReadPayload, CollectionHookWritePayload } from './types.js'

import { Result } from '@aeriajs/types'
import {
  checkImmutabilityWrite,
  checkOwnershipRead,
  checkOwnershipWrite,
  checkPagination,
} from './index.js'

const chainFunctions = async <TPayload extends {}>(
  _props: CollectionHookProps<TPayload>,
  context: Context,
  functions: (CollectionHook<NoInfer<TPayload>> | null)[],
) => {
  const props = Object.assign({}, _props)
  for( const fn of functions ) {
    if( !fn ) {
      continue
    }

    const { error, result } = await fn(props, context)
    if( error ) {
      return Result.error(error)
    }

    Object.assign(props.payload, result)
  }

  return Result.result(props.payload)
}

export const useSecurity = <TDescription extends Description>(context: Context<TDescription>) => {
  const beforeRead = async <TPayload extends Partial<CollectionHookReadPayload>>(payload?: TPayload) => {
    const newPayload = Object.assign({
      filters: {},
    }, payload)

    const props = {
      payload: newPayload,
    }

    return chainFunctions(props, context, [
      checkPagination,
      context.description.owned === 'on-write'
        ? null
        : checkOwnershipRead,
    ])
  }

  const beforeWrite = async <TPayload extends CollectionHookWritePayload>(payload?: TPayload) => {
    const newPayload = Object.assign({
      what: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    return chainFunctions(props, context, [
      checkOwnershipWrite,
      checkImmutabilityWrite,
    ])
  }

  return {
    beforeRead,
    beforeWrite,
  }
}

