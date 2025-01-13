import type { Location } from './token.js'
import { Result } from '@aeriajs/types'
import { isValidCollection } from '@aeriajs/common'
import { locationMap } from './parser.js'
import * as AST from './ast.js'

export const analyze = async (ast: AST.ProgramNode, errors: unknown[] = []) => {
  const checkForeignProperties = async <TProperty extends AST.PropertyNode['property']>(
    foreignCollection: AST.CollectionNode,
    property: TProperty,
    attributeName: keyof {
      [
        P in keyof TProperty as NonNullable<TProperty[P]> extends readonly string[]
          ? P
          : never
      ]: null
    }
  ) => {
    for( const foreignPropName of property[attributeName] as string[] ) {
      let hasProperty = foreignPropName in foreignCollection.properties
      if( !hasProperty ) {
        if( foreignCollection.extends ) {
          const { packageName, symbolName } = foreignCollection.extends
          const { [symbolName]: importedCollection } = await import(packageName)

          if( !isValidCollection(importedCollection) ) {
            throw new Error
          }

          hasProperty = foreignPropName in importedCollection.description.properties
        }
      }

      let location: Location | undefined
      if( property[AST.LOCATION_SYMBOL] ) {
        location = locationMap.get(property[AST.LOCATION_SYMBOL][attributeName as string])
      }

      if( !hasProperty ) {
        errors.push({
          message: `collection "${foreignCollection.name}" hasn't such property "${foreignPropName}"`,
          location,
        })
      }
    }
  }

  const recurseProperty = async (node: AST.PropertyNode) => {
    if( node.nestedProperties && 'nestedProperties' in node ) {
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

      if( node.property.indexes ) {
        await checkForeignProperties(foreignCollection, node.property, 'indexes')
      }
      if( node.property.populate ) {
        await checkForeignProperties(foreignCollection, node.property, 'populate')
      }
      if( node.property.form ) {
        await checkForeignProperties(foreignCollection, node.property, 'form')
      }
    }
  }

  for( const node of ast.collections ) {
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

  if( errors.length ) {
    return Result.error(errors)
  }

  return Result.result({})
}

