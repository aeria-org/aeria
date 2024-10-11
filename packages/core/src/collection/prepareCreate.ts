import type { Description } from '@aeriajs/types'

export const prepareCreate = (doc: Record<string, unknown>, description: Description) => {
  const result: typeof doc = {}
  if( description.defaults ) {
    Object.assign(result, description.defaults)
  }

  Object.assign(result, doc)
  return result
}

