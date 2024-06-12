import type { SecurityCheck, SecurityCheckProps } from './types.js'
import type {
  Context,
  Description,
  GetAllPayload,
  InsertPayload,
} from '@aeriajs/types'

import { deepMerge, Result } from '@aeriajs/common'
import {
  checkImmutability,
  checkOwnershipRead,
  checkOwnershipWrite,
  checkPagination,
} from './index.js'

const chainFunctions = async <TProps extends SecurityCheckProps>(
  _props: TProps,
  context: Context,
  functions: (SecurityCheck | null)[],
) => {
  const props = Object.assign({
    filters: {},
  }, _props)

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
      context.description.owned === 'on-write'
        ? null
        : checkOwnershipRead,
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

