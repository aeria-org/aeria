import type * as AST from '../ast'
import { resizeFirstChar, getExtendName, getCollectionId } from './utils'

type SymbolToExport = {
  id: string
  schema: string
  extend: string
}

//[FilePath, CodeGenerator]
const codeGenerators = new Map<string, (symbols: SymbolToExport[]) => string>([
  [
    '/out/collections/index.js',
    (symbols) => `export { ${symbols.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
  ],
  [
    '/out/collections/index.d.ts',
    (symbols) => `export { ${symbols.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
  ],
  [
    '/out/contracts/index.js',
    (_symbols) => 'export * from \'./contracts.js\'',
  ],
  [
    '/out/contracts/index.d.ts',
    (_symbols) => 'export * from \'./contracts.js\'',
  ],
  [
    '/out/index.d.ts',
    (symbols) =>
      'export * as contracts from \'./contracts/index.js\'\n' +
      'export * as collections from \'./collections/index.js\'\n' +
            `export { ${symbols.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'`,
  ],
  [
    '/out/index.js',
    (symbols) =>
      'export * as contracts from \'./contracts/index.js\'\n' +
      'export * as collections from \'./collections/index.js\'\n' +
            `export { ${symbols.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'`,
  ],
])

export const generateExports = (ast: AST.Node[]) => {
  const symbolsToExport = ast.filter((node) => node.kind === 'collection').map<SymbolToExport>((node) => ({
    id: getCollectionId(node.name),
    schema: resizeFirstChar(node.name, true),
    extend: getExtendName(node.name),
  }))

  const statements: Record<string, string> = {}
  for( const [name, fn] of codeGenerators.entries() ) {
    statements[name] = fn(symbolsToExport)
  }

  return statements
}

