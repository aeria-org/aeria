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
      contracts,
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

        const endpointContracts: Record<'POST', ContractWithRoles | null> = {
          POST: null,
        }

        if( roles.length ) {
          endpointContracts.POST ??= {}
          endpointContracts.POST.roles = roles
        }

        if( contracts && fnName in contracts ) {
          endpointContracts.POST ??= {}
          Object.assign(endpointContracts.POST, contracts[fnName])
        }

        if( fnName in builtinFunctions ) {
          endpointContracts.POST ??= {}
          endpointContracts.POST.builtin = true
        }

        functions[endpoint as RouteUri] = endpointContracts
      }
    }
  }

  const result = deepMerge(
    functions,
    router?.routesMeta || {},
  )

  return result
}

