import type { AccessCondition, Collection, Context } from '@aeriajs/types'
import { defineCollection, get, getAll, remove, upload, removeFile } from '@aeriajs/core'
import { description } from './description.js'
import { authenticate } from './authenticate.js'
import { activate } from './activate.js'
import { insert } from './insert.js'
import { createAccount } from './createAccount.js'
import { getInfo } from './getInfo.js'
import { getCurrentUser } from './getCurrentUser.js'
import { getActivationLink } from './getActivationLink.js'

const functions = {
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
} as const

const exposedFunctions: Record<keyof typeof functions, AccessCondition> = {
  get: true,
  getAll: ['root'],
  remove: ['root'],
  upload: true,
  removeFile: true,
  insert: true,
  authenticate: 'unauthenticated',
  activate: 'unauthenticated',
  createAccount: 'unauthenticated',
  getInfo: 'unauthenticated',
  getCurrentUser: true,
  getActivationLink: ['root'],
}

export const user = defineCollection({
  description,
  functions: functions as {
    [P in keyof typeof functions]: (
      payload: Parameters<typeof functions[P]>[0],
      context: Omit<Context, 'token'>
    ) => ReturnType<typeof functions[P]>
  },
})

Object.assign(user, {
  exposedFunctions,
  contracts: {
    getCurrentUser: {
      response: {
        $ref: 'user',
      },
    },
  },
} satisfies Partial<Collection>)

