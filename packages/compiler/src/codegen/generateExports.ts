import type * as AST from '../ast.js'
import { resizeFirstChar, getExtendName, getCollectionId } from './utils.js'

type SymbolToExport = {
  id: string
  schema: string
  extend: string
}

export const generateExports = (ast: AST.Node[]) => {
  const symbolsToExport = ast.filter((node) => node.kind === 'collection').map<SymbolToExport>((node) => ({
    id: getCollectionId(node.name),
    schema: resizeFirstChar(node.name, true),
    extend: getExtendName(node.name),
  }))

  return {
    collections: {
      js: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
      dTs: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
    },
    contracts: {
      js: 'export * from \'./contracts.js\'',
      dTs: 'export * from \'./contracts.js\'',
    },
    main: {
      js: 'export * as contracts from \'./contracts/index.js\'\n' +
        'export * as collections from \'./collections/index.js\'\n' +
        `export { ${symbolsToExport.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'`,
      dTs: 'export * as contracts from \'./contracts/index.js\'\n' +
        'export * as collections from \'./collections/index.js\'\n' +
        `export { ${symbolsToExport.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'`,
    },
  }
}

