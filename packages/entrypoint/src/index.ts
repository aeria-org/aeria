import type { Collection, ApiConfig } from '@aeriajs/types'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { dynamicImport } from '@aeriajs/common'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>> | undefined
let availableRolesMemo: string[] | undefined

const collectionMemo: Record<string, Collection | undefined> = {}

const DEFAULT_CONFIG: ApiConfig = {
  security: {
    mutableUserProperties: [],
  },
}

export const getEntrypointPath = async () => {
  if( process.env.AERIA_MAIN ) {
    return path.join(process.cwd(), process.env.AERIA_MAIN)
  }

  const { main, aeriaMain } = JSON.parse(await fs.readFile(path.join(process.cwd(), 'package.json'), {
    encoding: 'utf8',
  }))

  return path.join(process.cwd(), aeriaMain || main)
}

export const getEntrypoint = async () => {
  const path = await getEntrypointPath()
  return dynamicImport(path)
}

const internalGetCollections = async (): Promise<Record<string, Collection | (()=> Collection)>> => {
  const entrypoint = await getEntrypoint()

  const collections = entrypoint.collections
    ? entrypoint.collections
    : entrypoint.default.options.collections

  return Object.assign({}, collections)
}

export const getCollections = async () => {
  if( collectionsMemo ) {
    return collectionsMemo
  }

  collectionsMemo = await internalGetCollections()
  return Object.freeze(collectionsMemo)
}

export const getCollection = async (collectionName: string): Promise<Collection | undefined> => {
  if( collectionMemo[collectionName] ) {
    return collectionMemo[collectionName]
  }

  const collections = await getCollections()
  const candidate = collectionName in collections
    ? collections[collectionName]
    : undefined

  const collection = typeof candidate === 'function'
    ? candidate()
    : candidate

  if( collection ) {
    collectionMemo[collectionName] = collection
  }

  return Object.assign({}, collection)
}

export const getRouter = async () => {
  const entrypoint = await getEntrypoint()
  if( entrypoint.router ) {
    return entrypoint.router
  }

  return entrypoint.default
    ? entrypoint.default.options.router
    : null
}

export const getConfig = async (): Promise<ApiConfig> => {
  const entrypoint = await getEntrypoint()

  return entrypoint.default
    ? entrypoint.default.options.config
    : DEFAULT_CONFIG
}

export const getAvailableRoles = async () => {
  if( availableRolesMemo ) {
    return availableRolesMemo
  }

  const collections = await getCollections()
  const availableRoles = []

  if( 'user' in collections ) {
    const collection = typeof collections.user === 'function'
      ? collections.user()
      : collections.user

    if(
      'roles' in collection.description.properties
      && 'items' in collection.description.properties.roles
      && 'enum' in collection.description.properties.roles.items
    ) {
      availableRoles.push(...collection.description.properties.roles.items.enum)
    }
  }

  for( const collectionName in collections ) {
    const candidate = collections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    if( !collection.exposedFunctions ) {
      continue
    }

    for( const fnName in collection.exposedFunctions ) {
      const exposed = collection.exposedFunctions[fnName]
      if( Array.isArray(exposed) ) {
        availableRoles.push(...exposed)
      }
    }
  }

  const rolesSet = new Set(availableRoles)
  rolesSet.delete('unauthenticated')

  availableRolesMemo = Array.from(rolesSet)
  return availableRolesMemo
}

