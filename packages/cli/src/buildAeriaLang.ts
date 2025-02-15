import { Result } from '@aeriajs/types'
import { compileFromFiles } from '@aeriajs/compiler'
import * as fs from 'node:fs'

export const SCHEMAS_DIR = 'schemas'

export const buildAeriaLangPhase = async () => {
  if( !fs.existsSync(SCHEMAS_DIR) ) {
    return Result.result(`skipped build as the schemas directory ${SCHEMAS_DIR} wasn't found`)
  }

  const result = await compileFromFiles(SCHEMAS_DIR, {
    outDir: '.aeria/out',
  })

  if( !result.success ) {
    return Result.error(result.errors.map((error) => `\n${error.fileLocation}:${error.location.line} at column (${error.location.start}-${error.location.end}) - ${error.message}`).join(' | '))
  }

  if( !('emittedFiles' in result) ) {
    return Result.result('no aeria schemas to build')
  }

  return Result.result('aeria schemas built')
}

