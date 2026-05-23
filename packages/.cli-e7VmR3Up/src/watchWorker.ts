import { mirrorSdk } from './mirrorSdk.js'

const main = async () => {
  await mirrorSdk({
    environment: 'development',
  })
}

main()

