import type { Either } from '@aeriajs/types'
import { parseArgs } from 'node:util'
import { isLeft, unwrapEither } from '@aeriajs/common'
import { log } from './log.js'
import { bundle } from './bundle.js'
import { compilationPhase } from './compile.js'
import { watch } from './watch.js'
import { migrate } from './migrate.js'
import { iconsExtraction } from './iconsExtraction.js'

const { values: opts } = parseArgs({
  options: {
    watch: {
      type: 'boolean',
      short: 'w',
    },
    compile: {
      type: 'boolean',
      short: 'c',
    },
    icons: {
      type: 'boolean',
      short: 'i',
    },
    migrate: {
      type: 'boolean',
      short: 'm',
    },
    bundle: {
      type: 'boolean',
      short: 'b',
    },
  },
})

const phases: (()=> Promise<Either<string, string>>)[] = []

async function main() {
  if( opts.watch ) {
    return watch()
  }

  if( opts.compile ) {
    phases.push(compilationPhase)
  }

  if( opts.icons ) {
    phases.push(iconsExtraction)
  }

  if( opts.migrate ) {
    phases.push(migrate)
  }

  if( opts.bundle ) {
    phases.push(bundle)
  }

  return phases.reduce(async (a: any, phase) => {
    if( !await a ) {
      return
    }

    const resultEither = await phase()
    if( isLeft(resultEither) ) {
      log('error', unwrapEither(resultEither))
      log('info', 'pipeline aborted')
      return
    }

    const result = unwrapEither(resultEither)
    log('info', result)
    return true
  }, true)
}

main()

