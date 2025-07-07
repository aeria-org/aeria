import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { getCollections } from '@aeriajs/entrypoint'
import { Result } from '@aeriajs/types'
import { extractIcons, iconsJsContent, iconsDtsContent } from './icons.js'

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
  await fs.writeFile(path.join(base, 'icons.js'), iconsJsContent(uniqueIcons))
  await fs.writeFile(path.join(base, 'icons.d.ts'), iconsDtsContent(uniqueIcons))

  return Result.result('icon extraction succeeded')
}

