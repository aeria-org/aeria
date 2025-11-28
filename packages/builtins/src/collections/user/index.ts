import type { AccessCondition, Collection, Context } from '@aeriajs/types'
import { defineCollection, get, getAll, remove, upload, removeFile } from '@aeriajs/core'
import { description } from './description.js'
import { authenticate, authenticateContract } from './authenticate.js'
import { activate, activateContract } from './activate.js'
import { insert } from './insert.js'
import { createAccount, createAccountContract } from './createAccount.js'
import { getInfo, getInfoContract } from './getInfo.js'
import { getCurrentUser, getCurrentUserContract } from './getCurrentUser.js'
import { getActivationLink, getActivationLinkContract } from './getActivationLink.js'
import { redefinePassword, redefinePasswordContract } from './redefinePassword.js'
import { getRedefinePasswordLink, getRedefinePasswordLinkContract } from './getRedefinePasswordLink.js'
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
      context: Omit<Context, 'token'>,
    ) => ReturnType<typeof functions[P]>
  },
})

Object.assign(user, {
  exposedFunctions,
  contracts: {
    activate: activateContract,
    authenticate: authenticateContract,
    createAccount: createAccountContract,
    editProfile: editProfileContract,
    getActivationLink: getActivationLinkContract,
    getCurrentUser: getCurrentUserContract,
    getInfo: getInfoContract,
    getRedefinePasswordLink: getRedefinePasswordLinkContract,
    redefinePassword: redefinePasswordContract,
  },
} satisfies Partial<Collection>)

