import type { RoutesMeta } from '@aeriajs/http'
import type { ContractWithRoles, RouteUri } from '@aeriajs/types'
import { getCollections, getRouter, getAvailableRoles } from '@aeriajs/entrypoint'
import { deepMerge } from '@aeriajs/common'
import { isFunctionExposed, FunctionExposedStatus } from './accessControl.js'
import * as builtinFunctions from './functions/index.js'

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

