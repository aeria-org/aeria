import type { AccessCondition, Collection, Context } from '@aeriajs/types'
import { defineCollection, get, getAll, remove, upload, removeFile } from '@aeriajs/core'
import { description } from './description.js'
import { authenticate, authenticateContract } from './authenticate.js'
import { activate } from './activate.js'
import { insert } from './insert.js'
import { createAccount, createAccountContract } from './createAccount.js'
import { getInfo } from './getInfo.js'
import { getCurrentUser, getCurrentUserContract } from './getCurrentUser.js'
import { getActivationLink } from './getActivationLink.js'
import { redefinePassword } from './redefinePassword.js'
import { getRedefinePasswordLink } from './getRedefinePasswordLink.js'
import { editProfile, editProfileContract } from './editProfile.js'

const functions = {
  get,
  getAll,
  remove,
  upload,
  removeFile,
  insert,
  editProfile,
  authenticate,
  activate,
  createAccount,
  getInfo,
  getCurrentUser,
  getActivationLink,
  getRedefinePasswordLink,
  redefinePassword,
} as const

const exposedFunctions: Record<keyof typeof functions, AccessCondition> = {
  get: true,
  getAll: ['root'],
  remove: ['root'],
  upload: true,
  removeFile: true,
  insert: ['root'],
  editProfile: true,
  authenticate: 'unauthenticated',
  activate: [
    'unauthenticated',
    'root',
  ],
  createAccount: 'unauthenticated',
  getInfo: 'unauthenticated',
  getCurrentUser: true,
  getActivationLink: ['root'],
  getRedefinePasswordLink: ['root'],
  redefinePassword: [
    'unauthenticated',
    'root',
  ],
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
    authenticate: authenticateContract,
    createAccount: createAccountContract,
    editProfile: editProfileContract,
    getCurrentUser: getCurrentUserContract,
  },
} satisfies Partial<Collection>)

