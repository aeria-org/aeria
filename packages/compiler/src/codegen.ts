import { generateExports, generateJavascript, generateTypescript } from './codegen/index.js'
import type * as AST from './ast'
import fs from 'fs'

export const generateCode = (ast: AST.Node[]) => {
  const typescript = generateTypescript(ast)
  const javascript = generateJavascript(ast)
  const exports = generateExports(ast)

  //test
  fs.mkdirSync('./.aeria-test/out/collections/', {
    recursive: true,
  })
  fs.writeFileSync('./.aeria-test/out/collections/collections.d.ts', typescript)
  fs.writeFileSync('./.aeria-test/out/collections/collections.js', javascript)

  for (const path in exports) {
    fs.writeFileSync('./.aeria-test/' + path, exports[path])
  }

  return ast
}
