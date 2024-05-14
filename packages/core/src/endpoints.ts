import type { RoutesMeta } from '@aeriajs/http'
import type { Collection, ContractWithRoles, RouteUri, Token } from '@aeriajs/types'
import { getCollections, getRouter, getConfig, getAvailableRoles } from '@aeriajs/entrypoint'
import { deepMerge, arraysIntersects } from '@aeriajs/common'
import * as builtinFunctions from './functions/index.js'

export enum FunctionExposedStatus {
  FunctionNotExposed = 'FUNCTION_NOT_EXPOSED',
  FunctionNotGranted = 'FUNCTION_NOT_GRANTED',
  FunctionAccessible = 'FUNCTION_ACCESSIBLE',
}

export const isFunctionExposed = async (collection: Collection, fnName: string, token?: Token) => {
  if( !collection.functions ) {
    return FunctionExposedStatus.FunctionNotExposed
  }

  const fn = collection.functions[fnName]
  const config = await getConfig()

  if( collection.exposedFunctions && fnName in collection.exposedFunctions ) {
    const exposed = collection.exposedFunctions[fnName]

    if( Array.isArray(exposed) ) {
      if( !token ) {
        return FunctionExposedStatus.FunctionAccessible
      }

      const roleIntersects = token.authenticated
        ? arraysIntersects(token.roles, exposed)
        : exposed.includes('guest')

      return roleIntersects
        ? FunctionExposedStatus.FunctionAccessible
        : FunctionExposedStatus.FunctionNotGranted
    }

    return exposed
      ? FunctionExposedStatus.FunctionAccessible
      : FunctionExposedStatus.FunctionNotExposed
  }

  if( fn.exposed ) {
    return FunctionExposedStatus.FunctionAccessible
  }

  if( config.security.exposeFunctionsByDefault ) {
    return fn.exposed !== false
      ? FunctionExposedStatus.FunctionAccessible
      : FunctionExposedStatus.FunctionNotExposed
  }

  return FunctionExposedStatus.FunctionNotExposed
}

export const getEndpoints = async (): Promise<RoutesMeta> => {
  const router = await getRouter()
  const collections = await getCollections()

  const functions: RoutesMeta = {}

  for( const collectionName in collections ) {
    const candidate = collections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    const {
      description,
      functions: collectionFunctions,
      functionContracts,
      exposedFunctions = {},
    } = collection

    if( collectionFunctions ) {
      for( const fnName in collectionFunctions ) {
        const exposedStatus = await isFunctionExposed(collection, fnName)
        if( exposedStatus !== FunctionExposedStatus.FunctionAccessible ) {
          continue
        }

        const endpoint = `/${description.$id}/${fnName}`
        const exposed = exposedFunctions[fnName]
        const roles = Array.isArray(exposed)
          ? exposed
          : exposed
            ? await getAvailableRoles()
            : []

        const contracts: Record<'POST', ContractWithRoles | null> = {
          POST: null,
        }

        if( roles.length ) {
          contracts.POST ??= {}
          contracts.POST.roles = roles
        }

        if( functionContracts && fnName in functionContracts ) {
          contracts.POST ??= {}
          Object.assign(contracts.POST, functionContracts[fnName])
        }

        if( fnName in builtinFunctions ) {
          contracts.POST ??= {}
          contracts.POST.builtin = true
        }

        functions[endpoint as RouteUri] = contracts
      }
    }
  }

  const result = deepMerge(
    functions,
    router?.routesMeta || {},
  )

  return result
}

