import type { Collection, ApiConfig } from '@aeriajs/types'
import { dynamicImport } from '@aeriajs/common'
import path from 'path'
import fs from 'fs/promises'

let collectionsMemo: Awaited<ReturnType<typeof internalGetCollections>> | undefined
const collectionMemo: Record<string, Collection | undefined> = {}

export const getEntrypointPath = async () => {
  const { main, aeriaMain } = JSON.parse(await fs.readFile(path.join(process.cwd(), 'package.json'), {
    encoding: 'utf8',
  }))

  return path.join(process.cwd(), aeriaMain || main)
}

export const getEntrypoint = async () => {
  return dynamicImport(await getEntrypointPath())
}

const internalGetCollections = async (): Promise<Record<string, Collection | (()=> Collection)>> => {
  const entrypoint = await getEntrypoint()

  const collections = entrypoint.collections
    ? entrypoint.collections
    : entrypoint.default.options.collections

  return Object.assign({}, collections)
}

export const getCollections = async ({ memoize } = {
  memoize: true,
}) => {
  if( memoize && collectionsMemo ) {
    return Object.assign({}, collectionsMemo)
  }

  collectionsMemo = await internalGetCollections()
  return collectionsMemo
}

export const getCollection = async (collectionName: string): Promise<Collection | undefined> => {
  if( collectionMemo[collectionName] ) {
    return collectionMemo[collectionName]
  }

  const collections = await getCollections()
  const candidate: any = collections[collectionName]
  if( !candidate ) {
    return
  }

  const collection = typeof candidate === 'function'
    ? candidate()
    : candidate

  collectionsMemo![collectionName] = candidate

  return collection
}

export const getRouter = async () => {
  const entrypoint = await getEntrypoint()
  return entrypoint.router
}

export const getConfig = async (): Promise<ApiConfig> => {
  const entrypoint = await getEntrypoint()
  return entrypoint.default
    ? entrypoint.default.options.config
    : {}
}

