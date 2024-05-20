import type { InstanceConfig } from './types.js'
import { dynamicImport } from '@aeriajs/common'
import * as path from 'path'

export const publicUrl = (config: InstanceConfig) => {
  if( typeof config.publicUrl === 'string' ) {
    return config.publicUrl
  }

  return config.environment === 'development'
    ? config.publicUrl.development
    : config.publicUrl.production
}

export const getConfig = async (): Promise<InstanceConfig> => {
  const { aeriaSdk } = await dynamicImport(path.join(process.cwd(), 'package.json'))
  if( typeof aeriaSdk !== 'object' || !aeriaSdk ) {
    throw new Error('aeriaSdk is absent in package.json')
  }

  return aeriaSdk

}
