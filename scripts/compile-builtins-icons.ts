#!/usr/bin/env -S pnpm ts-node --swc

import path from 'path'
import { extractIcons, iconsEsmContent, iconsCjsContent, iconsDtsContent } from '../packages/aeria-build/dist/index.js'
import * as fs from 'fs/promises'
import * as presets from '../packages/api/dist/presets/index.js'
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

  const uniqueIcons = [...new Set(icons)]
  await fs.writeFile(path.join(DIST_PATH, 'index.mjs'), iconsEsmContent(uniqueIcons))
  await fs.writeFile(path.join(DIST_PATH, 'index.js'), iconsCjsContent(uniqueIcons))
  await fs.writeFile(path.join(DIST_PATH, 'index.d.ts'), iconsDtsContent(uniqueIcons))
}

main()

