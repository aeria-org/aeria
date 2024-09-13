export const getValueFromPath = <TValue>(object: Record<string, unknown>, path: string): TValue => {
  const fragments = path.split('.')
  return fragments.reduce((a, fragment) => {
    return a && a[fragment as keyof typeof a]
  }, object as unknown) as TValue
}
