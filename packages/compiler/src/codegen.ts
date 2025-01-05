import { generateContracts, generateExports, generateJSCollections, generateTSCollections } from './codegen/index.js'
import type * as AST from './ast'
import * as fs from 'node:fs'

export const generateCode = (ast: AST.Node[]) => {
  const typescript = generateTSCollections(ast)
  const javascript = generateJSCollections(ast)
  const exports = generateExports(ast)
  const contracts = generateContracts(ast)

  //test
  fs.mkdirSync('./.aeria-test/out/collections/', {
    recursive: true,
  })
  fs.mkdirSync('./.aeria-test/out/contracts/', {
    recursive: true,
  })
  fs.writeFileSync('./.aeria-test/out/collections/collections.d.ts', typescript)
  fs.writeFileSync('./.aeria-test/out/collections/collections.js', javascript)

  for (const path in exports) {
    fs.writeFileSync('./.aeria-test/' + path, exports[path])
  }

  for (const path in contracts) {
    fs.writeFileSync('./.aeria-test/' + path, contracts[path as keyof typeof contracts])
  }

  return ast
}
