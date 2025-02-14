import type { Location } from './token.js'
import type { ArrayProperties } from './utils.js'
import type { CompilationOptions } from './types.js'
import { isValidCollection } from '@aeriajs/common'
import { locationMap } from './parser.js'
import { Diagnostic } from './diagnostic.js'
import * as AST from './ast.js'

const collectionHasProperty = async (collection: AST.CollectionNode, propName: string, options: Pick<CompilationOptions, 'languageServer'>) => {
  let hasProperty = propName in collection.properties
  if( !hasProperty ) {
    if( options.languageServer ) {
      return true
    }
    if( collection.extends ) {
      const { packageName, symbolName } = collection.extends
      const { [symbolName]: importedCollection } = await import(packageName)

      if( !isValidCollection(importedCollection) ) {
        throw new Error
      }

      hasProperty = propName in importedCollection.description.properties
    }
  }

  return hasProperty
}

export const analyze = async (ast: AST.ProgramNode, options: Pick<CompilationOptions, 'languageServer'>, errors: Diagnostic[] = []) => {
  const checkCollectionForeignProperties = async <TProperty extends Extract<AST.PropertyNode['property'], { $ref: string }>>(
    foreignCollection: AST.CollectionNode,
    property: TProperty,
    attributeName: ArrayProperties<TProperty>,
  ) => {
    if( !property[attributeName] ) {
      return
    }

    for( const foreignPropName of property[attributeName] as string[] ) {
      if( !await collectionHasProperty(foreignCollection, foreignPropName, options) ) {
        let location: Location | undefined
        if( property[AST.LOCATION_SYMBOL] ) {
          location = locationMap.get(property[AST.LOCATION_SYMBOL].attributes[attributeName])
        }

        errors.push(new Diagnostic(`collection "${foreignCollection.name}" hasn't such property "${foreignPropName}"`, location))
      }
    }
  }

  const checkCollectionLocalProperties = async (node: AST.CollectionNode, attributeName: ArrayProperties<AST.CollectionNode>) => {
    if( !node[attributeName] ) {
      return
    }

    for( const index in node[attributeName] ) {
      const propName = node[attributeName][index]
      const symbol = node[AST.LOCATION_SYMBOL].arrays[attributeName]![index]
      if( !await collectionHasProperty(node, propName, options) ) {
        const location = locationMap.get(symbol)

        errors.push(new Diagnostic(`collection "${node.name}" hasn't such property "${propName}"`, location))
      }
    }
  }

  const checkObjectLocalProperties = async (node: AST.PropertyNode, attributeName: ArrayProperties<Extract<AST.PropertyNode['property'], { properties: unknown }>>) => {
    if( !('properties' in node.property) || !node.property[attributeName] ) {
      return
    }

    for( const index in node.property[attributeName] ) {
      const propName = node.property[attributeName][index]
      const symbol = node.property[AST.LOCATION_SYMBOL]!.arrays[attributeName]![index]
      if( !(propName in node.property.properties) ) {
        const location = locationMap.get(symbol)

        errors.push(new Diagnostic(`object "xxx" hasn't such property "${propName}"`, location))
      }
    }
  }

  const recurseProperty = async (node: AST.PropertyNode) => {
    if( node.nestedProperties && 'nestedProperties' in node ) {
      await checkObjectLocalProperties(node, 'required')
      await checkObjectLocalProperties(node, 'writable')
      await checkObjectLocalProperties(node, 'form')

      for( const propName in node.nestedProperties ) {
        const subProperty = node.nestedProperties[propName]
        await recurseProperty(subProperty)
      }
    } else if( '$ref' in node.property ) {
      const refName = node.property.$ref
      const foreignCollection = ast.collections.find(({ name }) => name === refName)

      if( !foreignCollection ) {
        throw new Error
      }

      await checkCollectionForeignProperties(foreignCollection, node.property, 'indexes')
      await checkCollectionForeignProperties(foreignCollection, node.property, 'populate')
      await checkCollectionForeignProperties(foreignCollection, node.property, 'form')
    }
  }

  for( const node of ast.collections ) {
    await checkCollectionLocalProperties(node, 'indexes')
    await checkCollectionLocalProperties(node, 'filters')
    await checkCollectionLocalProperties(node, 'form')
    await checkCollectionLocalProperties(node, 'table')

    for( const propName in node.properties ) {
      const subNode = node.properties[propName]
      await recurseProperty(subNode)
    }
  }

  for( const node of ast.contracts ) {
    if( node.payload ) {
      await recurseProperty(node.payload)
    }
    if( node.query ) {
      await recurseProperty(node.query)
    }
    if( node.response ) {
      if( Array.isArray(node.response) ) {
        for( const subNode of node.response ) {
          await recurseProperty(subNode)
        }
      } else {
        await recurseProperty(node.response)
      }
    }
  }

  return {
    errors,
  }
}

