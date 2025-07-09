export const dynamicImport = async (path: string) => {
  try {
    return require(path)
  } catch( err ) {
  }

  const fn = new Function(`return (async () => {
      const { pathToFileURL } = await import('url')
      return import(pathToFileURL('${path.replace(/\\/g, '\\\\')}'))
    })()`)

  return fn()
}

