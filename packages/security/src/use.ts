import { deepMerge, right, isLeft, unwrapEither } from '@aeriajs/common'
import type { SecurityCheck, SecurityCheckProps } from './types'
import type {
  Context,
  Description,
  GetAllPayload,
  InsertPayload,
} from '@aeriajs/types'

import {
  checkImmutability,
  checkOwnershipRead,
  checkOwnershipWrite,
  checkPagination,
} from './index.js'

const chainFunctions = async <
  TContext,
  TPayload extends Record<string, any>,
  TFunction extends SecurityCheck,
  TProps extends SecurityCheckProps<TPayload>,
>(
  _props: TProps,
  context: TContext extends Context<any>
    ? TContext
    : never,
  functions: TFunction[],
) => {
  const props = Object.assign({
    filters: {},
  }, _props)

  for( const fn of functions ) {
    const resultEither = await fn(props, context)
    if( isLeft(resultEither) ) {
      return resultEither
    }

    const result = unwrapEither(resultEither)
    Object.assign(props.payload, result)
  }

  return right(props.payload)
}

export const useSecurity = <TDescription extends Description>(context: Context<TDescription>) => {
  const options = context.description.options
    ? Object.assign({}, context.description.options)
    : {}

  const beforeRead = async <TPayload extends Partial<GetAllPayload<any>>>(payload?: TPayload) => {
    const newPayload = Object.assign({}, payload)
    newPayload.filters ??= {}

    if( options.queryPreset ) {
      Object.assign(newPayload, deepMerge(
        newPayload,
        options.queryPreset,
      ))
    }

    const props = {
      payload: newPayload,
    }

    return chainFunctions(props, context, [
      checkPagination,
      checkOwnershipRead,
    ])
  }

  const beforeWrite = async <TPayload extends Partial<InsertPayload<any>>>(payload?: TPayload) => {
    const newPayload = Object.assign({
      what: {},
    }, payload)
    const props = {
      payload: newPayload,
    }

    return chainFunctions(props, context, [
      checkOwnershipWrite,
      checkImmutability,
    ])
  }

  return {
    beforeRead,
    beforeWrite,
  }
}

