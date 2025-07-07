import { parseArgs } from 'node:util'
import { mirrorRemotely } from './mirror.js'
import { getConfig } from './config.js'

const { values: opts } = parseArgs({
  options: {
    dev: {
      type: 'boolean',
      short: 'd',
    },
  },
})

export const main = async () => {
  const config = await getConfig()
  if( opts.dev ) {
    config.environment = 'development'
  }

  mirrorRemotely(config)
}

