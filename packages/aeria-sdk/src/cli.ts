import { mirrorRemotely } from './mirror.js'
import { getConfig } from './utils.js'

const main = async () => {
  const config = await getConfig()
  mirrorRemotely(config)
}

main()
