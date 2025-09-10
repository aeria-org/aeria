import type { Description, SchemaWithId } from '@aeriajs/types'
import { freshItem } from '@aeriajs/common'

export const defineDescription = <const TDescription extends Description<TDescription>>(description: TDescription) => {
  return description
}

export const defineDescriptionTuple = <const TDescription extends Description<TDescription>>(description: TDescription) => [
  freshItem(description),
  description,
] as unknown as [
  SchemaWithId<TDescription>,
  TDescription,
]

