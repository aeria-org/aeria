import { Result } from '@aeriajs/types'
import { getUserTsconfig } from './compile.js'
import { compileFromFiles } from '@aeriajs/compiler'

export const buildAeriaLang = async () => {
  const tsConfig = await getUserTsconfig()

  try {
    return await compileFromFiles(['schemas/*.aeria'], {
      outDir: '.aeria/out'
    })

  } catch( err ) {
    if( (err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }
  }
}

export const buildAeriaLangPhase = async () => {
  /* const _result =  */await buildAeriaLang()
  return Result.result('result')
  /*   if( !result ) {
    return Result.result('skipped aeria-lang build (@aeria-lang/build dependency is absent)')
  }

  if( !result.success ) {
    return Result.error(ppDiagnostic(result.diagnostics))
  }

  if( result.emittedFiles.length === 0 ) {
    return Result.result('no aeria files to build')
  }

  return Result.result(result.emittedFiles.length > 0
    ? 'aeria files built'
    : 'no aeria files to build') */
}

