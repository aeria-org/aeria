import type { InstanceConfig } from './types.js'

export const publicUrl = (config: InstanceConfig) => {
  if( typeof config.publicUrl === 'string' ) {
    return config.publicUrl
  }

  if( config.environment === 'development' ) {
    return config.publicUrl.development
  }

  switch( typeof config.publicUrl.production ) {
    case 'string': return config.publicUrl.production
    case 'object': {
      return typeof window === 'undefined'
        ? config.publicUrl.production.ssr
        : config.publicUrl.production.client
    }
  }
}

