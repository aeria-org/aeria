import type { Description } from '@aeriajs/types'

export const normalizeProjection = <
  TDescription extends Pick<Description, 'properties'>,
  TProjectedProperties extends (keyof TDescription['properties'])[],
>(
  properties: TProjectedProperties,
  description: TDescription,
) => {
  const target = Array.from(properties)
  if( target.length === 0 ) {
    target.push(...Object.keys(description.properties))
  }

  const projection = target.reduce((a, key) => {
    if( key !== '_id' && description.properties[key].hidden ) {
      return a
    }

    return {
      ...a,
      [key]: 1,
    }
  }, {})

  return Object.keys(projection).length === 0
    ? null
    : projection
}

