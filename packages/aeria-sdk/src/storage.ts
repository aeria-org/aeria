import type { InstanceConfig, StorageStrategy } from './types.js'
import type { AuthenticationResult } from './auth.js'
import { DEFAULT_STORAGE_NAMESPACE } from './constants.js'

export const storageMemo: Record<string, unknown> = {}

export const storageKey = (key: string, config: InstanceConfig) => {
  const namespace = config.storage?.namespace || DEFAULT_STORAGE_NAMESPACE
  return `${namespace}:${key}`
}

export const getStorage = (config: InstanceConfig) => {
  let strategy: StorageStrategy

  if( config.storage?.strategy ) {
    if( config.storage.strategy === 'localStorage' ) {
      // eslint-disable-next-line
      if( typeof localStorage === 'object' && localStorage && typeof localStorage.getItem === 'function' ) {
        strategy = 'localStorage'
      } else {
        console.warn('localStorage not available, failing back to memory storage')
        strategy = 'memo'
      }

    } else {
      strategy = config.storage.strategy
    }
  } else {
    strategy = 'none'
  }

  function get(key: 'auth'): AuthenticationResult | null
  function get(key: string) {
    switch( strategy ) {
      case 'memo': {
        return storageMemo[key] || null
      }
      case 'localStorage': {
        const value = localStorage.getItem(storageKey(key, config))
        return value
          ? JSON.parse(value)
          : null
      }
    }
  }

  return {
    get,
    remove: (key: string) => {
      switch( strategy ) {
        case 'memo': {
          delete storageMemo[key]
          break
        }
        case 'localStorage': {
          localStorage.removeItem(storageKey(key, config))
          break
        }
      }
    },
    set: (key: string, value: unknown) => {
      switch( strategy ) {
        case 'memo': {
          storageMemo[key] = value
          break
        }
        case 'localStorage': {
          const serialized = JSON.stringify(value)
          localStorage.setItem(storageKey(key, config), serialized)
          break
        }
      }
    },
  }
}

