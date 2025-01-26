import { Result } from '@aeriajs/types'
import { compileFromFiles } from '@aeriajs/compiler'

export const buildAeriaLang = async () => {
  try {
    return await compileFromFiles('schemas', {
      outDir: '.aeria/out',
    })

  } catch( err ) {
    if( (err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }
  }
}

export const buildAeriaLangPhase = async () => {
  const result = await buildAeriaLang()
  if( !result ) {
    return Result.result('skipped aeria-lang build (@aeria-lang/build dependency is absent)')
  }

  if( !result.success ) {
    return Result.error(result.errors.map((error) => `\n${error.message} at line ${error.location?.line}, column ${error.location?.start}-${error.location?.end}`).join(' | '))
  }

  if( Object.keys(result.emittedFiles).length === 0 ) {
    return Result.result('no aeria files to build')
  }

  return Result.result(Object.keys(result.emittedFiles).length > 0
    ? 'aeria files built'
    : 'no aeria files to build')
}

