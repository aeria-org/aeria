import type { InstanceConfig } from 'aeria-sdk'
import { builtinFunctions } from '@aeriajs/builtins'
import { Result } from '@aeriajs/types'

export const mirrorSdk = async (defaultConfig?: Partial<InstanceConfig>) => {
  try {
    const { getConfig } = await import('aeria-sdk/config')
    const { writeMirrorFiles } = await import('aeria-sdk/mirror')

    const response = await builtinFunctions.describe({
      router: true,
    })

    if( !('result' in response) ) {
      throw new Error('invalid response')
    }

    const { error, result: mirror } = response
    if( error ) {
      return Result.error(error.code)
    }

    const config = Object.assign(
      defaultConfig || {},
      await getConfig(),
    )

    await writeMirrorFiles(mirror, config)

  } catch( err ) {
    if( (err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }

    return Result.result('skipped sdk mirroring (aeria-sdk dependency is absent)')
  }

  return Result.result('sdk mirrored')
}

