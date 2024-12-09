import type { InstanceConfig } from './types.js'
import * as path from 'path'
import * as fs from 'fs/promises'

export const getConfig = async (): Promise<InstanceConfig> => {
  const { aeriaSdk } = JSON.parse(await fs.readFile(path.join(process.cwd(), 'package.json'), {
    encoding: 'utf8',
  }))

  if( typeof aeriaSdk !== 'object' || !aeriaSdk ) {
    throw new Error('aeriaSdk is absent in package.json')
  }

  return aeriaSdk

}

