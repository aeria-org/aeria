import type { Description, OptionalId } from '@aeriajs/types'
import { freshItem } from '@aeriajs/common'

export const fill = <TDocument extends OptionalId<any>>(
  doc: TDocument & Record<string, any>,
  description: Description,
) => {
  const docCopy = Object.assign({}, doc)
  for( const key in docCopy ) {
    if( docCopy[key] === null ) {
      delete docCopy[key]
    }
  }
  return Object.assign(freshItem(description), docCopy)
}

