import type { WatchOptions } from './watch.js'
import { WATCH_BUILD_PATH } from './constants.js'
import { compile } from './compile.js'
import ts from 'typescript'

process.on('message', async (options: WatchOptions) => {
  if( options.commonjs ) {
    await compile({
      outDir: WATCH_BUILD_PATH,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      emitDeclarationOnly: true,
    })

    return
  }

  await compile({
    outDir: WATCH_BUILD_PATH,
    emitDeclarationOnly: true,
  })

})
