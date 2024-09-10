import type { AssetType, Context, Collection, Token } from '@aeriajs/types'
import { Result, ACError } from '@aeriajs/types'
import { limitRate } from '@aeriajs/security'
import { getCollection } from '@aeriajs/entrypoint'
import { isFunctionExposed, FunctionExposedStatus } from './accessControl.js'

const assetsMemo: {
  assets: Record<string, Record<string, Awaited<ReturnType<typeof internalGetCollectionAsset>>> | undefined>
} = {
  assets: {},
}

export const internalGetCollectionAsset = async <
  TCollectionName extends string,
  TAssetName extends keyof Collections[TCollectionName] & AssetType,
>(
  collectionName: TCollectionName,
  assetName: TAssetName,
) => {
  const collection = await getCollection(collectionName)
  const asset = collection?.[assetName]

  if( !asset ) {
    return Result.error(ACError.ResourceNotFound)
  }

  return Result.result(asset)
}

export const getCollectionAsset = async <
  TCollectionName extends string,
  TAssetName extends keyof Collections[TCollectionName] & AssetType,
>(
  collectionName: TCollectionName,
  assetName: TAssetName,
) => {
  const cached = assetsMemo.assets[collectionName]
  if( cached?.[assetName] ) {
    return Result.result(cached[assetName] as NonNullable<Collection[TAssetName]>)
  }

  const { error, result: asset } = await internalGetCollectionAsset(collectionName, assetName)
  if( error ) {
    return Result.error(error)
  }

  assetsMemo.assets[collectionName] ??= {}
  assetsMemo.assets[collectionName][assetName] = asset

  return Result.result(asset)
}

export const getFunction = async <TFunction extends (payload: any, context: Context) => unknown>(
  collectionName: string,
  functionName: string,
  token?: Token,
  options = {
    exposedOnly: false,
  },
) => {
  const { error, result: functions } = await getCollectionAsset(collectionName, 'functions')
  if( error ) {
    return Result.error(error)
  }

  if( !(functionName in functions) ) {
    return Result.error(ACError.FunctionNotFound)
  }

  const collection = await getCollection(collectionName)
  const fn = functions[functionName]

  if( !collection ) {
    return Result.error(ACError.ResourceNotFound)
  }

  if( options.exposedOnly ) {
    const exposedStatus = await isFunctionExposed(collection, functionName, token)

    switch( exposedStatus ) {
      case FunctionExposedStatus.FunctionNotExposed: return Result.error(ACError.FunctionNotExposed)
      case FunctionExposedStatus.FunctionNotGranted: return Result.error(ACError.AuthorizationError)
    }
  }

  const wrapper = async (payload: unknown, context: Context) => {
    const securityPolicy = collection.security?.functions?.[functionName]

    if( securityPolicy ) {
      if( securityPolicy.rateLimiting ) {
        const { error } = await limitRate(securityPolicy.rateLimiting, context)
        if( error ) {
          return Result.error(error)
        }
      }
    }

    return fn(payload, context)
  }

  return Result.result(wrapper as TFunction)
}

