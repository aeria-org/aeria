import { Result } from '@aeriajs/types'
import { compileFromFiles } from '@aeriajs/compiler'

export const OUT_DIR = '.aeria/out'

export const buildAeriaLangPhase = async () => {
  const result = await compileFromFiles({
    outDir: OUT_DIR,
  })

  if( !result.success ) {
    return Result.error(result.errors.map((error) => `\n${error.fileLocation}:${error.location.line} at column (${error.location.start}-${error.location.end}) - ${error.message}`).join(' | '))
  }

  if( !('emittedFiles' in result) ) {
    return Result.result('no aeria schemas to build')
  }

  return Result.result('aeria schemas built')
}

