import type { DescriptionPreset } from '@aeriajs/types'
import { add } from './add.js'
import { crud } from './crud.js'
import { removeAll } from './removeAll.js'
import { duplicate } from './duplicate.js'
import { owned } from './owned.js'
import { remove } from './remove.js'
import { timestamped } from './timestamped.js'
import { view } from './view.js'

export const presets = {
  add,
  crud,
  removeAll,
  duplicate,
  owned,
  remove,
  timestamped,
  view,
} satisfies Record<DescriptionPreset, unknown>
