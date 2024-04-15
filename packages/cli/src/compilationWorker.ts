import { compile } from './compile.js'
import { log } from './log.js'

const main = async () => {
  process.on('message', async () => {
    const result = await compile({
      emitDeclarationOnly: true,
    })

    if( result.success ) {
      log('info', 'types emitted with no errors')
    }
  })
}

main()

