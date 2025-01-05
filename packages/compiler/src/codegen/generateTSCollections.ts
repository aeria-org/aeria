import { type Collection, type Property } from 'aeria'
import type * as AST from '../ast'
import { getProperties, stringify, makeASTImports, resizeFirstChar, aeriaPackageName, getCollectionId, type StringifyProperty, UnquotedSymbol } from './utils'

const initialImportedTypes = [
  'Collection',
  'SchemaWithId',
  'ExtendCollection',
  'Context',
]

export const generateTSCollections = (ast: AST.Node[]): string => {
  let code = ''
  code += `import type { ${initialImportedTypes.join(', ')} } from '${aeriaPackageName}'\n` //Used types
  const importsResult = makeASTImports(ast)
  code += importsResult.code + '\n\n'
  code += makeTSCollections(ast, importsResult.modifiedSymbols) + '\n'
  return code
}

/** Creates the code exporting the collection type, declaration, schema and extend for each collection and returns them in a string */
const makeTSCollections = (ast: AST.Node[], modifiedSymbols: Record<string, string>) => {
  return ast.filter((node): node is AST.CollectionNode => node.type === 'collection')
    .map((collectionNode) => {
      const id = getCollectionId(collectionNode.name) //CollectionName -> collectionName
      const schemaName = resizeFirstChar(collectionNode.name, true) //collectionName -> CollectionName
      const typeName = id + 'Collection' //Pet -> petCollection

      const collectionType = `export declare type ${typeName} = ${
        id in modifiedSymbols ?
          `ExtendCollection<typeof ${modifiedSymbols[id]}, ${makeTSCollectionSchema(collectionNode, id)}>`
          : makeTSCollectionSchema(collectionNode, id)
      }`

      const collectionDeclaration = `export declare const ${id}: ${typeName} & { item: SchemaWithId<${typeName}["description"]> }`
      const collectionSchema = `export declare type ${schemaName} = SchemaWithId<typeof ${id}.description>`
      const collectionExtend = `export declare const extend${schemaName}Collection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">]?: Partial<Collection[P]>
            } & {
              functions?: {
                [F: string]: (payload: any, context: Context<typeof ${id}["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof ${id}, TCollection>`

      return [
        '//' + collectionNode.name,
        collectionType,
        collectionDeclaration,
        collectionSchema,
        collectionExtend,
      ].join('\n')
    }).join('\n\n')
}

const makeTSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
  const collectionSchema: Omit<Collection, 'item' | 'functions'> = {
    description: {
      $id: collectionId,
      properties: getProperties(collectionNode.properties) as Record<string, Property>,
    },
    ...(collectionNode.functions && {
      functions: makeTSFunctions(collectionNode.functions),
    }),
  }

  if (collectionNode.owned === true) {
    collectionSchema.description.owned = true
  }

  return stringify(collectionSchema)
}

/** Turns each function to 'typeof functioName' if it's from aeria or  */
const makeTSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.keys(functions).reduce<Record<string, StringifyProperty>>((acc, key) => {
    acc[key] = {
      [UnquotedSymbol]: functions[key].fromFunctionSet
        ? `typeof ${key}`
        : '() => never',
    }
    return acc
  }, {})
}
