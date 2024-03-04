import type { Description, Property } from '@aeriajs/types'
import { getReferenceProperty, deepMerge, serialize, isLeft, unwrapEither } from '@aeriajs/common'
import { getCollectionAsset } from '../assets.js'
import * as presets from '../presets/index.js'

export type PreloadOptions = {
  serialize?: boolean
  memoize?: boolean
  timestamps?: boolean
}

const preloadMemo: Record<string, Partial<Description> | undefined> = {}

const recurseProperty = async (_property: Property, propertyName: string, description: Partial<Description>): Promise<Property> => {
  const property = Object.assign({}, _property)

  if( 'items' in property ) {
    property.items = await recurseProperty(property.items, propertyName, description)
    return property
  }

  if( 'properties' in property ) {
    return preloadDescription(property, {
      memoize: false,
      timestamps: false,
    })
  }

  if( 'getter' in property ) {
    return {
      ...property,
      readOnly: true,
    } satisfies Property
  }

  const reference = getReferenceProperty(property)
  if( reference ) {
    if( !reference.indexes && !reference.inline ) {
      const referenceDescriptionEither = await getCollectionAsset(reference.$ref, 'description')
      if( isLeft(referenceDescriptionEither) ) {
        throw new Error(`description of ${reference.$ref} not found`)
      }

      const referenceDescription = unwrapEither(referenceDescriptionEither)
      const indexes = reference.indexes = referenceDescription.indexes?.slice()

      if( !indexes ) {
        throw new Error(`neither indexes or inline are present on reference property or indexes is set on target description on ${description.$id}.${propertyName}`)
      }
    }
  }

  return property
}

export const applyPreset = (
  entry: Partial<Description> | Description['properties'],
  presetName: keyof typeof presets,
  parentName?: string,
) => {
  const preset = presets[presetName]
  const presetObject = Object.assign({}, parentName
    ? preset[parentName as keyof typeof preset]
    : preset)

  return deepMerge(entry, presetObject, {
    callback: (_, left) => {
      if( left === null ) {
        return left
      }
    },
  })
}

export const preloadDescription = async <
  Options extends PreloadOptions,
  Return = Options extends { serialize: true }
    ? Buffer
    : Description,
>(originalDescription: Partial<Description>, options?: Options) => {
  const {
    memoize = !!originalDescription.$id,
    timestamps = true,
  } = options || {}

  if( memoize && preloadMemo[originalDescription.$id!] ) {
    const description = preloadMemo[originalDescription.$id!]!
    return (options?.serialize
      ? serialize(description)
      : description) as Return
  }

  const description = Object.assign({}, originalDescription)

  const descriptionPresets: (keyof typeof presets)[] = []
  if( description.presets ) {
    descriptionPresets.push(...description.presets)
  }

  if( description.owned ) {
    descriptionPresets.push('owned')
  }

  if( description.timestamps !== false && timestamps !== false ) {
    descriptionPresets.push('timestamped')
  }

  if( descriptionPresets.length > 0 ) {
    const merge = descriptionPresets.reduce(
      (a, presetName) => applyPreset(a, presetName),
      description,
    )

    Object.assign(description, merge)
  }

  if( description.properties ) {
    const properties: [string, Property][] = []
    for( const [propertyName, property] of Object.entries(description.properties) ) {
      properties.push([
        propertyName,
        await recurseProperty(property, propertyName, description),
      ])
    }

    description.properties = Object.fromEntries(properties)
  }

  if( memoize ) {
    preloadMemo[originalDescription.$id!] = description
  }

  return (options?.serialize
    ? serialize(description)
    : description) as Return
}
