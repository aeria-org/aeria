import type * as AST from '../ast.js'
import type { ContractWithRoles, Property } from '@aeriajs/types'
import { errorSchema, resultSchema } from '@aeriajs/types'
import { recursivelyUnwrapPropertyNodes, unwrapPropertyNode, stringify, UnquotedSymbol, type StringifyProperty } from './utils.js'

export const generateContracts = (ast: AST.ProgramNode) => {
  if (ast.contracts.length === 0) {
    return false
  }
  return {
    js: makeJSContractsCode(ast),
    dts: makeTSContractsCode(ast),
  }
}

const makeJSContractsCode = (ast: AST.ProgramNode) => {
  const imports = new Set<string>(['defineContract'])

  const getCodeForResponse = (responseProperty: AST.PropertyNode) => {
    const { kind, modifier, ...propertyNode } = responseProperty
    if (!modifier) {
      return stringify(unwrapPropertyNode(propertyNode))
    }
    const modifierSymbol = responseProperty.modifier === 'Result'
      ? 'resultSchema'
      : 'errorSchema'
    if (!imports.has(modifierSymbol)) {
      imports.add(modifierSymbol)
    }

    return `${modifierSymbol}(${stringify(unwrapPropertyNode(propertyNode))})`
  }

  const declarations = ast.contracts.map((node) => {
    const { name, kind, roles, response, ...contractProperty } = node

    let responseString: string | undefined
    if (response) {
      responseString = ''
      if (Array.isArray(response)) {
        const responseArray: StringifyProperty[] = []
        for (const responseElement of response) {
          responseArray.push({
            [UnquotedSymbol]: getCodeForResponse(responseElement),
          })
        }

        responseString = stringify(responseArray)
      } else {
        responseString = getCodeForResponse(response)
      }
    }

    const contractSchema: Record<keyof ContractWithRoles, unknown> = recursivelyUnwrapPropertyNodes(contractProperty)
    if (responseString) {
      contractSchema.response = {
        [UnquotedSymbol]: responseString,
      }
    }
    if (roles) {
      contractSchema.roles = roles
    }

    return `export const ${name} = defineContract(${
      stringify(contractSchema)
    })`
  }).join('\n\n')

  return `import { ${Array.from(imports).join(', ')} } from 'aeria'\n\n` + declarations
}

const getResponseSchema = (response: AST.PropertyNode) => {
  const responseSchema = unwrapPropertyNode(response)
  if (!response.modifier) {
    return responseSchema
  }

  return response.modifier === 'Result' ?
    resultSchema(responseSchema) :
    errorSchema(responseSchema)
}

const makeTSContractsCode = (ast: AST.ProgramNode) => {
  return ast.contracts.map((node) => {
    const { name, kind, roles, ...contractSchema } = node

    let responseSchema: Property | Property[] | null = null
    if (contractSchema.response) {
      if (Array.isArray(contractSchema.response)) {
        responseSchema = contractSchema.response.map(getResponseSchema)
      } else {
        responseSchema = getResponseSchema(contractSchema.response)
      }
    }

    const contractProperties: ContractWithRoles = recursivelyUnwrapPropertyNodes(contractSchema)
    if (responseSchema) {
      contractProperties.response = responseSchema
    }
    if (roles) {
      contractProperties.roles = roles
    }

    return `export declare const ${node.name}: ${
      stringify(contractProperties)
    }`
  }).join('\n\n')
}

