import type * as AST from '../ast'
import { resizeFirstChar, getExtendName } from './utils'

type SymbolToExport = {
  id: string,
  schema: string,
  extend: string
}

//FilePath: CodeGenerator
const codeGenerators = {
  // eslint-disable-next-line
    '/out/collections/index.js': (symbols: SymbolToExport[]) =>
    `export { ${symbols.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,

  // eslint-disable-next-line
    '/out/collections/index.d.ts': (symbols: SymbolToExport[]) =>
    `export { ${symbols.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,

  // eslint-disable-next-line
    '/out/index.d.ts': (symbols: SymbolToExport[]) => {
    return 'export * as collections from \'./collections/index.js\'\n' +
            `export { ${symbols.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'`
  },

  // eslint-disable-next-line
    '/out/index.js': (symbols: SymbolToExport[]) => {
    return 'export * as collections from \'./collections/index.js\'\n' +
            `export { ${symbols.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'`
  },
}

export const generateExports = (ast: AST.Node[]) => {
  const symbolsToExport = ast.filter((node) => node.type === 'collection')
    .map<SymbolToExport>((node) => ({
      id: resizeFirstChar(node.name, false),
      schema: resizeFirstChar(node.name, true),
      extend: getExtendName(node.name),
    }))

  return (Object.keys(codeGenerators) as Array<keyof typeof codeGenerators>)
    .reduce((acc, current) => {
      acc[current] = codeGenerators[current](symbolsToExport)
      return acc
    }, {} as any) as Record<keyof typeof codeGenerators, string>
}
