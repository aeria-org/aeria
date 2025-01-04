import type * as AST from '../ast'
import { getProperties, propertyToSchema, stringify, type StringifyProperty } from './utils'

export const generateContracts = (ast: AST.Node[]) => {
  return {
    ['out/collections/contracts.js']: makeJSContractsCode(ast),
    ['out/collections/contracts.d.ts']: makeTSContractsCode(ast),
  }
}

const makeJSContractsCode = (ast: AST.Node[]) => {
  const imports = ['defineContract']

  const getCodeForResponse = (responseProperty: AST.PropertyNode) => {
    const { type, modifier, ...propertyNode } = responseProperty
    if (!modifier) {
      return stringify(propertyToSchema(propertyNode as AST.PropertyNode))
    }
    const modifierSymbol = responseProperty.modifier === 'Result'
      ? 'resultSchema'
      : 'errorSchema'
    if (!imports.includes(modifierSymbol)) {
      imports.push(modifierSymbol)
    }

    return `${modifierSymbol}(${stringify(propertyToSchema(propertyNode as AST.PropertyNode))})`
  }

  const declarations = ast.filter((node) => node.type === 'contract')
    .map((contractNode) => {
      const { name, type, roles, response, ...contractProperty } = contractNode

      let responseString = ''
      if (response) {
        if (Array.isArray(response)) {
          const responseArray: StringifyProperty<object>[] = []
          for (const responseElement of response) {
            responseArray.push({
              '@unquoted': getCodeForResponse(responseElement),
            })
          }

          responseString = stringify(responseArray)
        } else {
          responseString = stringify(getCodeForResponse(response))
        }
      }

      const contractSchema: Record<string, any> = getProperties(contractProperty)
      contractSchema.response = {
        ['@unquoted']: responseString,
      }

      return `export const ${name}Contract = defineContract(${
        stringify(contractSchema)
      })`
    }).join('\n\n')
  return `import { ${imports.join(', ')} } from \'aeria\'\n\n` + declarations
}

const makeTSContractsCode = (ast: AST.Node[]) => {
  return ast.filter((node) => node.type === 'contract')
    .map((contractNode) => {
      const { name, type, roles, ...contractSchema } = contractNode
      return `export declare const ${contractNode.name}Contract: ${stringify(getProperties(contractSchema))}`
    }).join('\n\n')
}
