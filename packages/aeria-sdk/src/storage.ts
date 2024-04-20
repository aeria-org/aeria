import type { InstanceConfig, StorageStrategy } from './types.js'
import type { AuthenticationResult } from './auth.js'
import { DEFAULT_STORAGE_NAMESPACE } from './constants.js'

export const storageMemo: Record<string, string> = {}

export const storageKey = (key: string, config: InstanceConfig) => {
  const namespace = config.storage?.namespace || DEFAULT_STORAGE_NAMESPACE
  return `${namespace}:${key}`
}

export const getStorage = (config: InstanceConfig) => {
  const strategy: StorageStrategy = !config.storage?.strategy
    ? 'none'
    : config.storage.strategy === 'localStorage' && !('localStorage' in globalThis)
      ? 'none'
      : config.storage.strategy

  function get(key: 'auth'): AuthenticationResult | null
  function get(key: string) {
    switch( strategy ) {
      case 'memo':
        return storageMemo[key] || null
      case 'localStorage':
        const value = localStorage.getItem(storageKey(key, config))
        return value
          ? JSON.parse(value)
          : null
    }
  }

  return {
    get,
    remove: (key: string) => {
      switch( strategy ) {
        case 'memo':
          delete storageMemo[key]
          break
        case 'localStorage':
          localStorage.removeItem(storageKey(key, config))
          break
      }
    },
    set: (key: string, value: any) => {
      switch( strategy ) {
        case 'memo':
          storageMemo[key] = value
          break
        case 'localStorage':
          const serialized = JSON.stringify(value)
          return localStorage.setItem(storageKey(key, config), serialized)
      }
    },
  }
}

