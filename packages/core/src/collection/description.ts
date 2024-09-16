import type { Description, SchemaWithId } from '@aeriajs/types'

export const defineDescription = <const TDescription extends Description<TDescription>>(description: TDescription) => {
  return description
}

export const defineDescriptionTuple = <const TDescription extends Description<TDescription>>(description: Partial<TDescription>) => [
  {},
  description,
] as unknown as [
  SchemaWithId<TDescription>,
  TDescription,
]

export const isValidDescription = (value: unknown): value is Description => {
  return !!(
    value
    && typeof value === 'object'
    && '$id' in value
    && 'properties' in value
    && value.properties
    && typeof value.$id === 'string'
    && typeof value.properties === 'object'
  )
}

