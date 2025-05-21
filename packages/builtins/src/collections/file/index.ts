import { defineCollection, get } from '@aeriajs/core'
import { description } from './description.js'
import { insert } from './insert.js'
import { download, downloadContract } from './download.js'
import { remove } from './remove.js'
import { removeAll } from './removeAll.js'

export const tempFile = defineCollection({
  description: {
    $id: 'tempFile',
    icon: 'file',
    hidden: true,
    temporary: {
      index: 'created_at',
      expireAfterSeconds: 3600,
    },
    properties: {
      created_at: {
        type: 'string',
        format: 'date-time',
      },
      absolute_path: {
        type: 'string',
      },
      size: {
        type: 'number',
      },
      mime: {
        type: 'number',
      },
      collection: {
        type: 'string',
      },
      filename: {
        type: 'string',
      },
    },
  },
})

export const file = defineCollection({
  description,
  functions: {
    get,
    insert,
    download,
    remove,
    removeAll,
  },
  exposedFunctions: {
    get: 'unauthenticated',
    insert: true,
    download: 'unauthenticated',
    remove: true,
    removeAll: true,
  },
  contracts: {
    download: downloadContract,
  }
})

