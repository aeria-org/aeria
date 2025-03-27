import type * as AST from '../ast.js'
import type { ContractWithRoles, Property } from '@aeriajs/types'
import { errorSchema, resultSchema } from '@aeriajs/types'
import { recursivelyUnwrapPropertyNodes, unwrapPropertyNode, stringify, UnquotedSymbol, type StringifyProperty } from './utils.js'

export const generateContracts = (ast: AST.Node[]) => {
  const contractNodes = ast.filter((node) => node.kind === 'contract')
  if (contractNodes.length === 0) {
    return false
  }
  return {
    js: makeJSContractsCode(contractNodes),
    dts: makeTSContractsCode(contractNodes),
  }
}

const makeJSContractsCode = (contractAst: AST.ContractNode[]) => {
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

  const declarations = contractAst.map((contractNode) => {
    const { name, kind, roles, response, ...contractProperty } = contractNode

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
        responseString = stringify(getCodeForResponse(response))
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

  return `import { ${Array.from(imports).join(', ')} } from \'aeria\'\n\n` + declarations
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

const makeTSContractsCode = (contractAst: AST.ContractNode[]) => {
  return contractAst.map((contractNode) => {
    const { name, kind, roles, ...contractSchema } = contractNode

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

    return `export declare const ${contractNode.name}: ${
      stringify(contractProperties)
    }`
  }).join('\n\n')
}

