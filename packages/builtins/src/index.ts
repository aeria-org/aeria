import type {} from 'mongodb'
import type {} from '@aeriajs/validation'
export * as builtinFunctions from './functions/index.js'
export * from './collections/index.js'
export * from './authentication.js'
export {
  insert as insertUser,
} from './collections/user/insert.js'

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

