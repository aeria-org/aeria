import { Result } from '@aeriajs/types'

export const buildAeriaLang = async () => {
  try {
    const { compileFromFiles } = await import('@aeriajs/compiler')
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

  if( !result.emittedFiles || Object.keys(result.emittedFiles).length === 0 ) {
    return Result.result('no aeria files to build')
  }

  if( !result.success ) {
    return Result.error(result.errors.map((error) => `\n${error.fileLocation}:${error.location.line} at column (${error.location.start}-${error.location.end}) - ${error.message}`).join(' | '))
  }

  return Result.result(Object.keys(result.emittedFiles).length > 0
    ? 'aeria files built'
    : 'no aeria files to build')
}

