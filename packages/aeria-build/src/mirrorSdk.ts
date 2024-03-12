import path from 'path'
import { systemFunctions } from '@aeriajs/builtins'
import { right } from '@aeriajs/common'

export const mirrorSdk = async () => {
  try {
    const { getConfig } = await import('aeria-sdk/utils')
    const { writeMirrorFiles } = await import('aeria-sdk/mirror')

    const mirror = await systemFunctions.describe({
      router: true,
    })

    const config = await getConfig()
    await writeMirrorFiles(mirror, config, path.join(process.cwd(), '.aeria'))

  } catch( err: any ) {
    if( err.code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }
  }

  return right('sdk mirrored')
}

