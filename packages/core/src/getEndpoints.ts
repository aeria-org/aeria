import type { RoutesMeta } from '@aeriajs/http'
import type { ContractWithRoles, RouteUri } from '@aeriajs/types'
import { getCollections, getRouter } from '@aeriajs/entrypoint'
import { grantedFor } from '@aeriajs/access-control'
import { deepMerge } from '@aeriajs/common'
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
    } = collection

    if( collectionFunctions ) {
      for( const fnName in collectionFunctions ) {
        const fn = collectionFunctions[fnName]
        if( !fn.exposed && (!collection?.exposedFunctions || !collection.exposedFunctions.includes(fnName)) ) {
          continue
        }

        const endpoint = `/${description.$id}/${fnName}`
        const roles = await grantedFor(description.$id, fnName)

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

