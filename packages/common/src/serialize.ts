import * as BSON from 'bson'

export const serialize = (...args: Parameters<typeof BSON.serialize>) => Buffer.from(BSON.serialize(...args)).toString('latin1')

export const deserialize = <T extends ReturnType<typeof serialize>>(buffer: T) => {
  return BSON.deserialize(new Uint8Array(Array.from(buffer).map((c) => c.charCodeAt(0))))
}
