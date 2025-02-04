import type * as AST from '../ast.js'
import { getProperties, stringify, makeASTImports, resizeFirstChar, aeriaPackageName, getCollectionId, type StringifyProperty, UnquotedSymbol, defaultFunctions, getExposedFunctions } from './utils.js'
import { type Entries } from '../utils.js'

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
  return Object.values(ast
    .filter((node): node is AST.CollectionNode => node.kind === 'collection')
    .reduce<Record<string, string>>((collectionCodes, collectionNode) => {
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

      collectionCodes[collectionNode.name] = [
        '//' + collectionNode.name,
        collectionType,
        collectionDeclaration,
        collectionSchema,
        collectionExtend,
      ].join('\n')

      return collectionCodes
    }, {})).join('\n\n')
}

const makeTSCollectionSchema = (collectionNode: AST.CollectionNode, collectionId: string) => {
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
          collectionSchema[key] = makeTSFunctions(value)
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

/** Turns each function to 'typeof functioName' if it's from aeria or not */
const makeTSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.keys(functions).reduce<Record<string, StringifyProperty>>((acc, key) => {
    acc[key] = {
      [UnquotedSymbol]: defaultFunctions.includes(key)
        ? `typeof ${key}`
        : '() => never',
    }
    return acc
  }, {})
}
