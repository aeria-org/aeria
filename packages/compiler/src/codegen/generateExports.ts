import type * as AST from '../ast.js'
import { resizeFirstChar, getExtendName, getCollectionId } from './utils.js'

type SymbolToExport = {
  id: string
  schema: string
  extend: string
}

export const generateExports = (ast: AST.Node[], hasContracts = false) => {
  const symbolsToExport = Object.values(ast.filter((node) => node.kind === 'collection')
    .reduce<Record<string, SymbolToExport>>((symbols, node) => {
      const id = getCollectionId(node.name)
      symbols[id] = {
        id,
        schema: resizeFirstChar(node.name, true),
        extend: getExtendName(node.name),
      }

      return symbols
    }, {}))

  const exports: {
    main: {
      js: string
      dTs: string
    },
    collections: {
      js: string
      dTs: string
    },
    contracts?: {
      js: string
      dTs: string
    },
  } = {
    collections: {
      js: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
      dTs: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
    },
    main: {
      js: (hasContracts
        ? 'export * as contracts from \'./contracts/index.js\'\n'
        : '') +
        'export * as collections from \'./collections/index.js\'\n' +
        `export { ${symbolsToExport.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'`,
      dTs: (hasContracts
        ? 'export * as contracts from \'./contracts/index.js\'\n'
        : '') +
        'export * as collections from \'./collections/index.js\'\n' +
        `export { ${symbolsToExport.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'`,
    },
  }

  if (hasContracts) {
    exports.contracts = {
      js: 'export * from \'./contracts.js\'',
      dTs: 'export * from \'./contracts.js\'',
    }
  }

  return exports
}

