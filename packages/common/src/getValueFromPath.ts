export const getValueFromPath = (object: any, path: string) => {
  const fragments = path.split('.')
  return fragments.reduce((a, fragment) => {
    return a && a[fragment]
  }, object)
}
