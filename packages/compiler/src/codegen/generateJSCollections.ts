import type * as AST from '../ast.js'
import type { Entries } from '../utils.js'
import { makeASTImports, getProperties, stringify, aeriaPackageName, getExtendName, getCollectionId, UnquotedSymbol, defaultFunctions, getExposedFunctions } from './utils.js'
const initialImportedFunctions = [
  'extendCollection',
  'defineCollection',
]

export const generateJSCollections = (ast: AST.CollectionNode[]) => {
  let javascriptCode = ''
  const importsResult = makeASTImports(ast, {
    [aeriaPackageName]: new Set(initialImportedFunctions),
  })
  javascriptCode += importsResult.code + '\n\n'
  javascriptCode += makeJSCollections(ast, importsResult.modifiedSymbols) + '\n\n'

  return javascriptCode
}

const makeJSCollections = (ast: AST.CollectionNode[], modifiedSymbols: Record<string, string>) => {
  return Object.values(ast.reduce<Record<string, string>>((collectionCodes, collectionNode) => {
    const id = getCollectionId(collectionNode.name) //CollectionName -> collectionName
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

    return collectionCodes
  }, {})).join('\n\n')
}

const makeJSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
  const nodeEntries = Object.entries(collectionNode) as Entries<typeof collectionNode>
  return stringify(nodeEntries.reduce<Partial<Record<string, any>>>((collectionSchema, [key, value]) => {
    switch (key) {
      case 'properties':
        collectionSchema.description = {
          $id: collectionId,
          properties: getProperties(value),
        }
        break

      case 'owned':
        if (value) {
          collectionSchema.description.owned = value
        }
        break

      case 'functions':
        if (value) {
          collectionSchema.functions = {
            [UnquotedSymbol]: `{ ${makeJSFunctions(value)} }`,
          }

          collectionSchema.exposedFunctions = getExposedFunctions(value)
        }
        break

      case 'actions':
      case 'filters':
      case 'form':
      case 'icon':
      case 'indexes':
      case 'individualActions':
      case 'presets':
      case 'table':
      case 'search':
      case 'required':
        if (value) {
          Object.assign(collectionSchema.description, {
            [key]: value,
          })
        }
        break
    }
    return collectionSchema
  }, {}))
}

const makeJSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.entries(functions).map(([key, _value]) => defaultFunctions.includes(key)
    ? key
    : `${key}: () => { throw new Error('Function not implemented') }`).join(', ')
}
