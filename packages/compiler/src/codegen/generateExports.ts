import type * as AST from '../ast.js'
import { transformSymbolName } from '../utils.js'
import { getExtendName, getCollectionId } from './utils.js'

type SymbolToExport = {
  id: string
  schema: string
  extend: string
}

type Exports = {
  index: {
    js: string
    dts: string
  }
  collections: {
    js: string
    dts: string
  }
  contracts?: {
    js: string
    dts: string
  }
}

export const generateExports = (ast: AST.ProgramNode, options = {
  hasContracts: false,
}) => {
  const symbolsToExport = Object.values(ast.collections.reduce<Record<string, SymbolToExport>>((symbols, node) => {
    const id = getCollectionId(node.name)
    symbols[id] = {
      id,
      schema: transformSymbolName(node.name, {
        capitalize: true,
      }),
      extend: getExtendName(node.name),
    }

    return symbols
  }, {}))

  let indexJs =
    "export * as collections from './collections/index.js'\n" +
    `export { ${symbolsToExport.map((symbol) => symbol.extend).join(', ')} } from './collections/collections.js'\n`

  let indexDts =
    "export * as collections from './collections/index.js'\n" +
    `export { ${symbolsToExport.map((symbol) => `${symbol.extend}, ${symbol.schema}`).join(', ')} } from './collections/collections.js'\n`

  if( options.hasContracts ) {
    indexJs += "export * as contracts from './contracts/index.js'\n"
    indexDts += "export * as contracts from './contracts/index.js'\n"
  }

  const exports: Exports = {
    collections: {
      js: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
      dts: `export { ${symbolsToExport.map((symbol) => `${symbol.id}`).join(', ')} } from './collections.js'`,
    },
    index: {
      js: indexJs,
      dts: indexDts,
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

