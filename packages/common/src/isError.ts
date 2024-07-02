import type { Result } from '@aeriajs/types'

export const isError = (object: any): object is Result.Error<unknown> => {
  return object
    && object._tag === 'Error'
    && 'error' in object
}

