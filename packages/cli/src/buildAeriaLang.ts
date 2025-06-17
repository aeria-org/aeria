import { Result, type StaticConfig } from '@aeriajs/types'
import { compileFromFiles } from '@aeriajs/compiler'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { styleText } from 'node:util'

export const OUT_DIR = '.aeria/out'

export const buildAeriaLangPhase = async () => {
  const packageJson: { aeria?: StaticConfig } = JSON.parse(await fs.promises.readFile(path.join(process.cwd(), 'package.json'), {
    encoding: 'utf-8',
  }))

  const {
    outDir = OUT_DIR,
  } = packageJson.aeria || {}

  const result = await compileFromFiles({
    outDir,
  })

  if( !result.success ) {
    const errors: string[] = []
    for( const error of result.errors ) {
      let message = ''
      message += styleText('yellow', error.location.file)
      message += ':'
      message += styleText('bold', error.location.line.toString())
      message += `:${error.location.start} - `
      message += styleText(['bold', 'red'], 'error')
      message += `: ${error.message}`

      errors.push(message)
    }

    return Result.error('\n' + errors.join('\n'))
  }

  if( !('emittedFiles' in result) ) {
    return Result.result('no aeria schemas to build')
  }

  return Result.result('aeria schemas built')
}

