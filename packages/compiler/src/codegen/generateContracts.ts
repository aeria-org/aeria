import type * as AST from '../ast.js'
import type { Property } from '@aeriajs/types'
import { errorSchema, resultSchema } from '@aeriajs/types'
import { getProperties, propertyToSchema, stringify, UnquotedSymbol, type StringifyProperty } from './utils.js'

export const generateContracts = (ast: AST.Node[]) => {
  return {
    ['out/contracts/contracts.js']: makeJSContractsCode(ast),
    ['out/contracts/contracts.d.ts']: makeTSContractsCode(ast),
  }
}

const makeJSContractsCode = (ast: AST.Node[]) => {
  const imports = new Set<string>(['defineContract'])

  const getCodeForResponse = (responseProperty: AST.PropertyNode) => {
    const { kind, modifier, ...propertyNode } = responseProperty
    if (!modifier) {
      return stringify(propertyToSchema(propertyNode as AST.PropertyNode))
    }
    const modifierSymbol = responseProperty.modifier === 'Result'
      ? 'resultSchema'
      : 'errorSchema'
    if (!imports.has(modifierSymbol)) {
      imports.add(modifierSymbol)
    }

    return `${modifierSymbol}(${stringify(propertyToSchema(propertyNode as AST.PropertyNode))})`
  }

  const declarations = ast.filter((node) => node.kind === 'contract')
    .map((contractNode) => {
      const { name, kind, roles, response, ...contractProperty } = contractNode

      let responseString = ''
      if (response) {
        if (Array.isArray(response)) {
          const responseArray: StringifyProperty[] = []
          for (const responseElement of response) {
            responseArray.push({
              [UnquotedSymbol]: getCodeForResponse(responseElement),
            })
          }

          responseString = stringify(responseArray)
        } else {
          responseString = stringify(getCodeForResponse(response))
        }
      }

      const contractSchema: Record<string, unknown> = getProperties(contractProperty)
      contractSchema.response = {
        [UnquotedSymbol]: responseString,
      }

      return `export const ${name}Contract = defineContract(${
        stringify(contractSchema)
      })`
    }).join('\n\n')

  return `import { ${Array.from(imports).join(', ')} } from \'aeria\'\n\n` + declarations
}

const getResponseSchema = (response: AST.PropertyNode) => {
  const responseSchema = propertyToSchema(response)
  if (!response.modifier) {
    return responseSchema
  }

  return response.modifier === 'Result' ?
    resultSchema(responseSchema) :
    errorSchema(responseSchema)
}

const makeTSContractsCode = (ast: AST.Node[]) => {
  return ast.filter((node) => node.kind === 'contract')
    .map((contractNode) => {
      const { name, kind, roles, ...contractSchema } = contractNode

      let responseSchema: Property | Property[] | null = null
      if (contractSchema.response) {
        if (Array.isArray(contractSchema.response)) {
          responseSchema = contractSchema.response.map(getResponseSchema)
        } else {
          responseSchema = getResponseSchema(contractSchema.response)
        }
      }

      return `export declare const ${contractNode.name}Contract: ${
        stringify({
          ...getProperties(contractSchema),
          response: responseSchema,
        })
      }`
    }).join('\n\n')
}

