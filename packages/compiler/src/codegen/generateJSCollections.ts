import { type Collection, type Property } from 'aeria'
import type * as AST from '../ast'
import { makeASTImports, getProperties, stringify, aeriaPackageName, getExtendName, getCollectionId, type StringifyProperty } from './utils'
import type aeria from 'aeria'

const initialImportedFunctions = [
  'extendCollection',
  'defineCollection',
  'defineContract',
] satisfies (keyof typeof aeria)[]

export const generateJSCollections = (ast: AST.Node[]) => {
  let javascriptCode = ''
  const importsResult = makeASTImports(ast, {
    [aeriaPackageName]: new Set(initialImportedFunctions),
  })
  javascriptCode += importsResult.code + '\n\n'
  javascriptCode += makeJSCollections(ast, importsResult.modifiedSymbols) + '\n\n'

  return javascriptCode
}

const makeJSCollections = (ast: AST.Node[], modifiedSymbols: Record<string, string>) => {
  return ast.filter((node) => node.type === 'collection')
    .map((collectionNode) => {
      const id = getCollectionId(collectionNode.name) //CollectionName -> collectionName
      const extendCollectionName = getExtendName(collectionNode.name)

      const collectionDefinition =
            `export const ${id} = ${collectionNode.extends
              ? 'extendCollection'
              : 'defineCollection'}(${makeJSCollectionSchema(collectionNode, id)})`

      const collectionDeclaration =
      `export const ${extendCollectionName} = (collection) => extendCollection(${id in modifiedSymbols
        ? modifiedSymbols[id]
        : id}, collection)`

      return [
        '//' + collectionNode.name,
        collectionDefinition,
        collectionDeclaration,
      ].join('\n')
    }).join('\n\n')
}

const makeJSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
  const collectionSchema: Omit<Collection, 'item' | 'functions'> = {
    description: {
      $id: collectionId,
      properties: getProperties(collectionNode.properties) as Record<string, Property>,
    },
    ...(collectionNode.functions && {
      functions: {
        '@unquoted': `{ ${makeJSFunctions(collectionNode.functions)} }`,
      } satisfies StringifyProperty,
    }),
  }

  if (collectionNode.owned === true) {
    collectionSchema.description.owned = true
  }

  return stringify(collectionSchema)
}

const makeJSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.entries(functions).map(([key, value]) => value.fromFunctionSet
    ? key
    : `${key}: () => { throw new Error('Function not implemented') }`).join(', ')
}
