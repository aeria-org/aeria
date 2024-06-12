import type { InstanceConfig } from 'aeria-sdk'
import { systemFunctions } from '@aeriajs/builtins'
import { Result } from '@aeriajs/common'

export const mirrorSdk = async (defaultConfig?: Partial<InstanceConfig>) => {
  try {
    const { getConfig } = await import('aeria-sdk/utils')
    const { writeMirrorFiles } = await import('aeria-sdk/mirror')

    const mirror = await systemFunctions.describe({
      router: true,
    })

    const config = Object.assign(
      defaultConfig || {},
      await getConfig(),
    )

    await writeMirrorFiles(mirror, config)

  } catch( err: any ) {
    if( err.code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }

    return Result.result('skipped sdk mirroring (aeria-sdk dependency is absent)')
  }

  return Result.result('sdk mirrored')
}

