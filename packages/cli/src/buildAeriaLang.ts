import ts from 'typescript'
import { build, ppDiagnostic } from 'aeria-lang'
import { Result } from '@aeriajs/types'
import { getUserTsconfig } from './compile.js'

export const buildAeriaLang = async () => {
  const tsConfig = await getUserTsconfig()

  try {
    return await build(['schemas/*.aeria'], {
      outDir: '.aeria/out',
      // deprecated: new compiler only outputs esnext
      module: tsConfig.compilerOptions.module === ts.ModuleKind.CommonJS
        ? 'commonjs'
        : 'esnext',
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
    return Result.error(ppDiagnostic(result.diagnostics))
  }

  if( result.emittedFiles.length === 0 ) {
    return Result.result('no aeria files to build')
  }

  return Result.result(result.emittedFiles.length > 0
    ? 'aeria files built'
    : 'no aeria files to build')
}

