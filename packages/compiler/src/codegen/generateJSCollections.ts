import type { Description } from '@aeriajs/types'
import type * as AST from '../ast.js'
import { unwrapNode, recursivelyUnwrapPropertyNodes, stringify, makeASTImports, getCollectionId, UnquotedSymbol, getExposedFunctions, getExtendName, PACKAGE_NAME, DEFAULT_FUNCTIONS } from './utils.js'

const initialImportedFunctions = [
  'extendCollection',
  'defineCollection',
]

export const generateJSCollections = (ast: AST.CollectionNode[]) => {
  let javascriptCode = ''
  const importsResult = makeASTImports(ast, {
    [PACKAGE_NAME]: new Set(initialImportedFunctions),
  })
  javascriptCode += importsResult.code + '\n\n'
  javascriptCode += makeJSCollections(ast, importsResult.modifiedSymbols) + '\n\n'

  return javascriptCode
}

const makeJSCollections = (ast: AST.CollectionNode[], modifiedSymbols: Record<string, string>) => {
  const collectionCodes: Record<string, string> = {}

  for (const collectionNode of ast) {
    const id = getCollectionId(collectionNode.name) // CollectionName -> collectionName
    const extendCollectionName = getExtendName(collectionNode.name)

    const collectionDefinition =
      `export const ${id} = ${collectionNode.extends
        ? `extendCollection(${id in modifiedSymbols
          ? modifiedSymbols[id]
          : id}, ${makeJSCollectionSchema(collectionNode, id)})`
        : `defineCollection(${makeJSCollectionSchema(collectionNode, id)})`}`

    const collectionDeclaration =
      `export const ${extendCollectionName} = (collection) => extendCollection(${id}, collection)`

    collectionCodes[collectionNode.name] = [
      '//' + collectionNode.name,
      collectionDefinition,
      collectionDeclaration,
    ].join('\n')
  }

  return Object.values(collectionCodes).join('\n\n')
}

const makeJSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
  const collectionSchema: Record<string, unknown>
    & { description: Partial<Description> } = {
      description: {
        $id: collectionId,
      },
    }

  for (const key of Object.keys(collectionNode) as Array<keyof typeof collectionNode>) {
    if (collectionNode[key] === undefined) {
      continue
    }

    switch (key) {
      case 'properties':
        collectionSchema.description[key] = recursivelyUnwrapPropertyNodes(collectionNode[key])
        break
      case 'owned':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'functions':
        collectionSchema.functions = {
          [UnquotedSymbol]: `{ ${makeJSFunctions(collectionNode[key])} }`,
        }
        collectionSchema.exposedFunctions = getExposedFunctions(collectionNode[key])
        break
      case 'required':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'table':
      case 'filters':
      case 'indexes':
      case 'form':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'actions':
      case 'individualActions':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'icon':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'presets':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'search':
        collectionSchema.description[key] = collectionNode[key]
        break
      case 'layout':
        collectionSchema.description[key] = unwrapNode(collectionNode[key])
        break
      case 'formLayout':
        collectionSchema.description[key] = unwrapNode(collectionNode[key])
        break
    }
  }

  return stringify(collectionSchema)
}

const makeJSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.entries(functions).map(([key, _value]) => DEFAULT_FUNCTIONS.includes(key)
    ? key
    : `${key}: () => { throw new Error('Function not implemented') }`).join(', ')
}
