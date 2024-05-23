export const NEXT_SYMBOL = Symbol('NEXT_SYMBOL')

type NextObject = {
  [NEXT_SYMBOL]: null
}

export const next = () => {
  return {
    [NEXT_SYMBOL]: null,
  }
}

export const isNext = (object: any): object is NextObject => {
  const sym = Object.getOwnPropertyDescriptor(object, NEXT_SYMBOL)
  return !!sym
}

