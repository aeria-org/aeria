import { extractIcons, iconsJsContent, iconsDtsContent } from '../packages/cli/dist/index.js'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as presets from '../packages/core/dist/presets/index.js'
import * as collections from '../packages/builtins/dist/collections/index.js'

const DIST_PATH = path.resolve('./packages/builtins-icons/dist')

const main = async () => {
  const icons = []
  await fs.mkdir(DIST_PATH, {
    recursive: true,
  })

  for( const collectionName in collections ) {
    const collection = collections[collectionName as keyof typeof collections]
    icons.push(...extractIcons(collection.description))
  }

  for( const presetName in presets ) {
    const preset = presets[presetName as keyof typeof presets]
    icons.push(...extractIcons(preset))
  }

  const uniqueIcons = Array.from(new Set(icons))
  await fs.writeFile(path.join(DIST_PATH, 'index.js'), iconsJsContent(uniqueIcons))
  await fs.writeFile(path.join(DIST_PATH, 'index.d.ts'), iconsDtsContent(uniqueIcons))
}

main()

