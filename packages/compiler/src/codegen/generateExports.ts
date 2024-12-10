import type * as AST from '../ast'
import { resizeFirstChar, getExtendName } from './utils'

type SymbolToExport = {
  id: string,
  schema: string,
  extend: string
}

//[FilePath, CodeGenerator]
const codeGenerators = new Map<string, (symbols: SymbolToExport[]) => string>([
  [
    '/out/collections/index.js',
    (symbols: SymbolToExport[]) => `export { ${symbols.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
  ],

  [
    '/out/index.d.ts',
    (symbols: SymbolToExport[]) =>
      'export * as collections from \'./collections/index.js\'\n' +
            `export { ${symbols.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'`,
  ],

  [
    '/out/index.js',
    (symbols: SymbolToExport[]) =>
      'export * as collections from \'./collections/index.js\'\n' +
            `export { ${symbols.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'`,
  ],
])

export const generateExports = (ast: AST.Node[]) => {
  const symbolsToExport = ast.filter((node) => node.type === 'collection').map<SymbolToExport>((node) => ({
    id: resizeFirstChar(node.name, false),
    schema: resizeFirstChar(node.name, true),
    extend: getExtendName(node.name),
  }))

  const statements: Record<string, string> = {}
  for( const [name, fn] of codeGenerators.entries() ) {
    statements[name] = fn(symbolsToExport)
  }

  return statements
}
