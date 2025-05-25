import type * as AST from '../ast.js'
import { resizeFirstChar, getExtendName, getCollectionId } from './utils.js'

type SymbolToExport = {
  id: string
  schema: string
  extend: string
}

export const generateExports = (ast: AST.ProgramNode, options = { hasContracts: false }) => {
  const symbolsToExport = Object.values(ast.collections.reduce<Record<string, SymbolToExport>>((symbols, node) => {
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
      dts: string
    },
    collections: {
      js: string
      dts: string
    },
    contracts?: {
      js: string
      dts: string
    },
  } = {
    collections: {
      js: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
      dts: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
    },
    main: {
      js: (options.hasContracts
        ? "export * as contracts from './contracts/index.js'\n"
        : '') +
        "export * as collections from './collections/index.js'\n" +
        `export { ${symbolsToExport.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'`,
      dts: (options.hasContracts
        ? "export * as contracts from './contracts/index.js'\n"
        : '') +
        "export * as collections from './collections/index.js'\n" +
        `export { ${symbolsToExport.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'`,
    },
  }

  if (options.hasContracts) {
    exports.contracts = {
      js: "export * from './contracts.js'",
      dts: "export * from './contracts.js'",
    }
  }

  return exports
}

