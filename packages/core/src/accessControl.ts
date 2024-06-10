import type { Collection, Token } from '@aeriajs/types'
import { getConfig } from '@aeriajs/entrypoint'
import { isGranted } from '@aeriajs/common'

export enum FunctionExposedStatus {
  FunctionNotExposed = 'FUNCTION_NOT_EXPOSED',
  FunctionNotGranted = 'FUNCTION_NOT_GRANTED',
  FunctionAccessible = 'FUNCTION_ACCESSIBLE',
}

export const isFunctionExposed = async (collection: Collection, fnName: string, token?: Token) => {
  const config = await getConfig()
  if( !collection.functions ) {
    return FunctionExposedStatus.FunctionNotExposed
  }

  if( collection.exposedFunctions && fnName in collection.exposedFunctions ) {
    const exposed = collection.exposedFunctions[fnName]

    if( exposed === false ) {
      return FunctionExposedStatus.FunctionNotExposed
    }

    if( !token ) {
      return FunctionExposedStatus.FunctionAccessible
    }

    return isGranted(exposed, token)
      ? FunctionExposedStatus.FunctionAccessible
      : FunctionExposedStatus.FunctionNotGranted
  }

  if( config.security.exposeFunctionsByDefault ) {
    if( config.security.exposeFunctionsByDefault !== 'unauthenticated' && (!token || !token.authenticated) ) {
      return FunctionExposedStatus.FunctionNotGranted
    }

    return FunctionExposedStatus.FunctionAccessible
  }

  return FunctionExposedStatus.FunctionNotExposed
}

