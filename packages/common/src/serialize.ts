import * as BSON from 'bson'

export const serialize = (...args: Parameters<typeof BSON.serialize>) => Buffer.from(BSON.serialize(...args)).toString('latin1')

export const deserialize = <TValue>(buffer: ReturnType<typeof serialize>) => {
  return BSON.deserialize(new Uint8Array(Array.from(buffer).map((c) => c.charCodeAt(0)))) as TValue
}

