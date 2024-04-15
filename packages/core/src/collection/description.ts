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

