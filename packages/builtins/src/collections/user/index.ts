import type { AccessCondition, Collection, Context } from '@aeriajs/types'
import { defineCollection, get, getAll, remove, upload, removeFile } from '@aeriajs/core'
import { HTTPStatus, ACError, functionSchemas, resultSchema, endpointErrorSchema } from '@aeriajs/types'
import { AuthenticationError } from '../../authentication.js'
import { description } from './description.js'
import { authenticate } from './authenticate.js'
import { activate } from './activate.js'
import { insert } from './insert.js'
import { createAccount } from './createAccount.js'
import { getInfo } from './getInfo.js'
import { getCurrentUser } from './getCurrentUser.js'
import { getActivationLink } from './getActivationLink.js'
import { redefinePassword } from './redefinePassword.js'
import { getRedefinePasswordLink } from './getRedefinePasswordLink.js'
import { editProfile } from './editProfile.js'

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
    authenticate: {
      payload: {
        type: 'object',
        required: [],
        properties: {
          email: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
          revalidate: {
            type: 'boolean',
          },
          token: {
            type: 'object',
            properties: {
              type: {
                enum: ['bearer'],
              },
              content: {
                type: 'string',
              }
            }
          },
        }
      },
      response: [
        endpointErrorSchema({
          httpStatus: [
            HTTPStatus.Unauthorized,
          ],
          code: [
            ACError.AuthorizationError,
            AuthenticationError.InvalidCredentials,
            AuthenticationError.InactiveUser,
          ]
        }),
        resultSchema({
          type: 'object',
          properties: {
            user: {
              $ref: 'user',
            },
            token: {
              type: 'object',
              properties: {
                type: {
                  enum: ['bearer'],
                },
                content: {
                  type: 'string',
                }
              },
            },
          },
        })
      ],
    },
    editProfile: {
      payload: {
        type: 'object',
        required: [],
        properties: description.properties,
      },
      response: [
        functionSchemas.insertError(),
        resultSchema({
          $ref: 'user',
        }),
      ],
    },
    getCurrentUser: {
      response: [
        resultSchema({
          $ref: 'user',
        }),
      ],
    },
  },
} satisfies Partial<Collection>)

