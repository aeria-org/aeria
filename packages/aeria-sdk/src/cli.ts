import { parseArgs } from 'util'
import { mirrorRemotely } from './mirror.js'
import { getConfig } from './utils.js'

const { values: opts } = parseArgs({
  options: {
    dev: {
      type: 'boolean',
      short: 'd',
    },
  },
})

const main = async () => {
  const config = await getConfig()
  if( opts.dev ) {
    config.environment = 'development'
  }

  mirrorRemotely(config)
}

main()

