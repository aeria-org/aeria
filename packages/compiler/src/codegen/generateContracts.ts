import type * as AST from '../ast'
import { getProperties, stringify } from './utils'

export const generateContracts = (ast: AST.Node[]) => {
  return {
    ['out/collections/contracts.js']: makeJSContractsCode(ast),
    ['out/collections/contracts.d.ts']: makeTSContractsCode(ast),
  }
}

const makeJSContractsCode = (ast: AST.Node[]) => {
  return 'import { defineContract } from \'aeria\'\n\n' +
  ast.filter((node) => node.type === 'contract')
    .map((contractNode) => {
      const { name, type, roles, ...contractSchema } = contractNode
      return `export const ${contractNode.name}Contract = defineContract(${
        stringify(getProperties(contractSchema as any))
      })`
    }).join('\n\n')
}

const makeTSContractsCode = (ast: AST.Node[]) => {
  return ast.filter((node) => node.type === 'contract')
    .map((contractNode) => {
      const { name, type, roles, ...contractSchema } = contractNode
      return `export declare const ${contractNode.name}Contract: ${stringify(getProperties(contractSchema as any))}`
    }).join('\n\n')
}
