import type { ObjectId } from 'mongodb'

export const isObjectId = (value: any): value is ObjectId => {
  // we use this comparation instead of `value instanceof ObjectId` because
  // the latter is prone to errors when `mongodb` dependency is duplicated
  // -- when ./node_modules/mongodb and ../node_modules/mongodb are both
  // present and the bundler doesn't handle this correctly
  return value._bsontype === 'ObjectId'
}
