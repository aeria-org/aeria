export const isEmptyObject = (object: any) => {
  return object && Object.keys(object).length === 0 && object.constructor === Object
}

