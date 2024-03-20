export const deepClone = <const TObject>(obj: TObject): TObject => {
  return typeof structuredClone === 'function' && typeof window === 'undefined'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj))
}

