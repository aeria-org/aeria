import { ObjectId } from 'mongodb'
import { defineDescription } from '@aeriajs/core'
import { getConfig } from '@aeriajs/entrypoint'

const link = async (fileId: ObjectId) => {
  const config = await getConfig()
  return `${config.publicUrl || ''}/file/${fileId}`
}

const timestamp = (lastModified: unknown) => lastModified instanceof Date
  ? new Date(lastModified).getTime()
  : 'fresh'

export const description = defineDescription({
  $id: 'file',
  icon: 'paperclip',
  owned: 'always',
  presets: ['owned'],
  indexes: [
    'name',
    'link',
    'type',
  ],
  properties: {
    type: {
      type: 'string',
    },
    size: {
      type: 'number',
    },
    last_modified: {
      type: 'string',
      format: 'date-time',
    },
    name: {
      type: 'string',
    },
    absolute_path: {
      type: 'string',
    },
    relative_path: {
      type: 'string',
    },
    immutable: {
      type: 'boolean',
    },
    link: {
      getter: async (doc: object) => {
        if( '_id' in doc && 'last_modified' in doc && doc._id instanceof ObjectId ) {
          return `${await link(doc._id)}/${timestamp(doc.last_modified)}`
        }
      },
    },
    download_link: {
      getter: async (doc: object) => {
        if( '_id' in doc && 'last_modified' in doc && doc._id instanceof ObjectId ) {
          return `${await link(doc._id)}/download/${timestamp(doc.last_modified)}`
        }
      },
    },
  },
  actions: {
    deleteAll: {
      label: 'Remover',
      ask: true,
      selection: true,
    },
  },
  individualActions: {
    remove: {
      label: 'Remover',
      icon: 'trash',
      ask: true,
    },
  },
})
