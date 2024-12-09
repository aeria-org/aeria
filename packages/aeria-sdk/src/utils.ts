import type { InstanceConfig } from './types.js'

export const publicUrl = (config: InstanceConfig) => {
  if( typeof config.publicUrl === 'string' ) {
    return config.publicUrl
  }

  return config.environment === 'development'
    ? config.publicUrl.development
    : config.publicUrl.production
}

