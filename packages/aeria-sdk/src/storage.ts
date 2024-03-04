import type { InstanceConfig } from './types.js'
import type { AuthenticationResult } from './auth.js'

export const storageMemo: Record<string, string> = {}

export const storageKey = (key: string, config: InstanceConfig) => {
  const namespace = config.storage?.namespace || 'aeriaSdk'
  return `${namespace}:${key}`
}

export const getStorage = (config: InstanceConfig) => {
  const strategy = !config.storage?.strategy
    ? 'memo'
    : config.storage.strategy === 'localStorage' && !('localStorage' in globalThis)
      ? 'memo'
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
