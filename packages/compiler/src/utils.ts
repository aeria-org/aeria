export type ArrayProperties<T> = keyof {
  [
  P in Extract<keyof T, string> as NonNullable<T[P]> extends string[] | readonly string[]
    ? P
    : never
  ]: never
}

export const DEFAULT_EXPORT_SYMBOLS = {
  count: 'aeria',
  get: 'aeria',
  getAll: 'aeria',
  insert: 'aeria',
  remove: 'aeria',
  removeAll: 'aeria',
  removeFile: 'aeria',
  unpaginatedGetAll: 'aeria',
  upload: 'aeria',
}

