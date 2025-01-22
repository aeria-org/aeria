import { generateContracts, generateExports, generateJSCollections, generateTSCollections } from './codegen/index.js'
import type * as AST from './ast'

export const generateCode = (ast: AST.Node[], aeriaFolderPath: string) => {
  const generatedCodes = {
    [aeriaFolderPath + '/out/collections/collections.d.ts']: generateTSCollections(ast),
    [aeriaFolderPath + '/out/collections/collections.js']: generateJSCollections(ast),
  }
  
  const exports = generateExports(ast)
  for (const path in exports) {
    generatedCodes[aeriaFolderPath + `/${path}`] = exports[path] 
  }
  
  const contracts = generateContracts(ast)
  for (const path in generateContracts(ast)) {
    generatedCodes[aeriaFolderPath + `/${path}`] = contracts[path as keyof typeof contracts] 
  }

  return ast
}
