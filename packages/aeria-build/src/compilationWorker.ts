import { compile } from './compile.js'

const main = async () => {
  process.on('message', async () => {
    await compile({
      emitDeclarationOnly: true,
    })
  })
}

main()

