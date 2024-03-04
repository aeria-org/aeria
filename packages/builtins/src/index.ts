import type {} from 'mongodb'
import type {} from '@aeriajs/validation'
export * from './collections/index.js'
export * as systemFunctions from './functions/index.js'

import {
  file,
  tempFile,
  log,
  resourceUsage,
  user,
} from './collections/index.js'

type File = typeof file.item
type TempFile = typeof tempFile.item
type Log = typeof log.item
type ResourceUsage = typeof resourceUsage.item
type User = typeof user.item

export const collections = {
  file,
  tempFile,
  log,
  resourceUsage,
  user,
}

export type {
  File,
  TempFile,
  Log,
  ResourceUsage,
  User,
}

