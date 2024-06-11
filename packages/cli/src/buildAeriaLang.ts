import ts from 'typescript'
import { build, ppDiagnostic } from 'aeria-lang'
import { left, right } from '@aeriajs/common'
import { getUserTsconfig } from './compile.js'

export const buildAeriaLang = async () => {
  const tsConfig = await getUserTsconfig()

  try {
    return await build(['schemas/*.aeria'], {
      outDir: '.aeria/out',
      module: tsConfig.compilerOptions.module === ts.ModuleKind.CommonJS
        ? 'commonjs'
        : 'esnext',
    })

  } catch( err: any ) {
    if( err.code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }
  }
}

export const buildAeriaLangPhase = async () => {
  const result = await buildAeriaLang()
  if( !result ) {
    return right('skipped aeria-lang build (@aeria-lang/build dependency is absent)')
  }

  if( !result.success ) {
    return left(ppDiagnostic(result.diagnostics))
  }

  if( result.emittedFiles.length === 0 ) {
    return right('no aeria files to build')
  }

  return right(result.emittedFiles.length > 0
    ? 'aeria files built'
    : 'no aeria files to build')
}

