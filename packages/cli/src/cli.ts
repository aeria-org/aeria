import type { Either } from '@aeriajs/types'
import { parseArgs } from 'node:util'
import { isLeft, unwrapEither } from '@aeriajs/common'
import { log } from './log.js'
import { compilationPhase } from './compile.js'
import { watch } from './watch.js'
import { migrate } from './migrate.js'
import { iconsExtraction } from './iconsExtraction.js'
import { mirrorSdk } from './mirrorSdk.js'

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
    sdk: {
      type: 'boolean',
      short: 'k',
    },
    tsc: {
      type: 'boolean',
      short: 't',
    },
  },
})

const phases: (()=> Promise<Either<string, string>>)[] = []

async function main() {
  if( opts.watch ) {
    return watch({
      useTsc: opts.tsc,
    })
  }

  if( opts.compile ) {
    phases.push(() => compilationPhase({
      useTsc: opts.tsc,
    }))
  }

  if( opts.icons ) {
    phases.push(iconsExtraction)
  }

  if( opts.migrate ) {
    phases.push(migrate)
  }

  if( opts.sdk ) {
    phases.push(mirrorSdk)
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

