import type { InstanceConfig } from './types.js'
import path from 'path'

export const apiUrl = (config: InstanceConfig) => {
  if( typeof config.apiUrl === 'string' ) {
    return config.apiUrl
  }

  return process.env.NODE_ENV === 'production'
    ? config.apiUrl.production
    : config.apiUrl.development
}

export const getConfig = async () => {
  const { aeriaSdk } = await import(path.join(process.cwd(), 'package.json'))
  if( typeof aeriaSdk !== 'object' || !aeriaSdk ) {
    throw new Error('aeriaSdk is absent in package.json')
  }

  return aeriaSdk

}
