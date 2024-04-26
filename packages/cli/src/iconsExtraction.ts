import * as fs from 'fs/promises'
import path from 'path'
import { extractIcons, iconsEsmContent, iconsCjsContent, iconsDtsContent } from './icons.js'
import { getCollections } from '@aeriajs/entrypoint'
import { right } from '@aeriajs/common'

const DATA_PATH = '.aeria'

export const iconsExtraction = async () => {
  const collections = await getCollections()
  const base = path.join(process.cwd(), 'node_modules', DATA_PATH)
  const icons = []

  await fs.mkdir(base, {
    recursive: true,
  })

  for( const collectionName in collections ) {
    const candidate = collections[collectionName]
    const collection = typeof candidate === 'function'
      ? candidate()
      : candidate

    icons.push(...extractIcons(collection.description))
  }

  const uniqueIcons = Array.from(new Set(icons))
  await fs.writeFile(path.join(base, 'icons.mjs'), iconsEsmContent(uniqueIcons))
  await fs.writeFile(path.join(base, 'icons.cjs'), iconsCjsContent(uniqueIcons))
  await fs.writeFile(path.join(base, 'icons.d.ts'), iconsDtsContent(uniqueIcons))

  return right('icon extraction succeeded')
}

