export const dynamicImport = async (importPath: string) => {
  try {
    return require(importPath)
  } catch( err ) {
  }

  const { pathToFileURL } = await import('node:url')
  const { sep } = await import('node:path')

  const fixedPath = importPath.split(sep).join('/')
  return import(pathToFileURL(fixedPath).href)
}

