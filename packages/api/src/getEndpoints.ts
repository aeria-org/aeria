import type { RoutesMeta, RouteUri } from '@aeriajs/http'
import { getCollections, getRouter } from '@aeriajs/entrypoint'
import { grantedFor } from '@aeriajs/access-control'
import { deepMerge } from '@aeriajs/common'

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
        const endpoint = `/${description.$id}/${fnName}`
        const roles = await grantedFor(description.$id, fnName)

        const contract = functionContracts && fnName in functionContracts
          ? roles.length
            ? Object.assign({
              roles,
            }, functionContracts[fnName])
            : functionContracts[fnName]
          : roles.length
            ? {
              roles,
            }
            : null

        functions[endpoint as RouteUri] = {
          POST: contract,
        }
      }
    }
  }

  const result = deepMerge(
    functions,
    router.routesMeta,
  )

  return result
}

