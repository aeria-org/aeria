import type { WatchOptions } from './watch.js'
import { compile, getUserTsconfig } from './compile.js'
import ts from 'typescript'

const main = async () => {
  const tsConfig = await getUserTsconfig()

  process.on('message', async (options: WatchOptions) => {
    if( options.commonjs ) {
      await compile({
        outDir: tsConfig.compilerOptions.outDir,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node16,
        emitDeclarationOnly: true,
      })

      return
    }

    await compile({
      outDir: tsConfig.compilerOptions.outDir,
      emitDeclarationOnly: true,
    })

  })
}

main()

