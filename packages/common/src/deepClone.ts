export const deepClone = <const TObject>(obj: TObject): TObject => {
  return typeof 'structuredClone' === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj))
}
