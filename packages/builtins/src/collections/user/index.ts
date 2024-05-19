import type { AccessCondition } from '@aeriajs/types'
import { defineCollection, get, getAll, remove, upload, removeFile } from '@aeriajs/core'
import { leftSchema, rightSchema } from '@aeriajs/common'
import { description } from './description.js'
import { authenticate } from './authenticate.js'
import { activate } from './activate.js'
import { insert } from './insert.js'
import { createAccount } from './createAccount.js'
import { getInfo } from './getInfo.js'
import { getCurrentUser } from './getCurrentUser.js'
import { getActivationLink } from './getActivationLink.js'

const exposedFunctions: Record<string, AccessCondition> = {
  get: true,
  getAll: true,
  remove: true,
  upload: true,
  removeFile: true,
  insert: true,
  authenticate: 'unauthenticated',
  activate: 'unauthenticated-only',
  createAccount: 'unauthenticated-only',
  getInfo: 'unauthenticated',
  getCurrentUser: true,
  getActivationLink: true,
}

export const user = defineCollection({
  description,
  functions: {
    get,
    getAll,
    remove,
    upload,
    removeFile,
    insert,
    authenticate,
    activate,
    createAccount,
    getInfo,
    getCurrentUser,
    getActivationLink,
  },
  functionContracts: {
    getCurrentUser: {
      response: [
        leftSchema({
          type: 'object',
          variable: true,
        }),
        rightSchema({
          $ref: 'user',
        }),
      ],
    },
  },
  exposedFunctions: exposedFunctions as any,
})

