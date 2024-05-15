import type { Collection, Token } from '@aeriajs/types'
import { getConfig } from '@aeriajs/entrypoint'
import { arraysIntersects } from '@aeriajs/common'

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

  if( !token ) {
    return FunctionExposedStatus.FunctionAccessible
  }

  if( collection.exposedFunctions && fnName in collection.exposedFunctions ) {
    const exposed = collection.exposedFunctions[fnName]

    if( Array.isArray(exposed) ) {
      const roleIntersects = token.authenticated
        ? arraysIntersects(token.roles, exposed)
        : exposed.includes('guest')

      return roleIntersects
        ? FunctionExposedStatus.FunctionAccessible
        : FunctionExposedStatus.FunctionNotGranted
    }

    if( !exposed ) {
      return FunctionExposedStatus.FunctionNotExposed
    }

    if( token.authenticated ) {
      if( exposed === 'unauthenticated-only' ) {
        return FunctionExposedStatus.FunctionNotGranted
      }
    } else {
      if( exposed !== 'unauthenticated' ) {
        return FunctionExposedStatus.FunctionNotGranted
      }
    }

    return FunctionExposedStatus.FunctionAccessible
  }

  if( config.security.exposeFunctionsByDefault ) {
    if( config.security.exposeFunctionsByDefault !== 'unauthenticated' && !token.authenticated ) {
      return FunctionExposedStatus.FunctionNotGranted
    }

    return FunctionExposedStatus.FunctionAccessible
  }

  return FunctionExposedStatus.FunctionNotExposed
}

