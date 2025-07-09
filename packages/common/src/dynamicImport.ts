import { pathToFileURL } from 'node:url'
import * as path from 'node:path'

export const dynamicImport = (importPath: string) => {
  const fixedPath = importPath.split(path.sep).join('/')
  return import(pathToFileURL(fixedPath).href)
}

