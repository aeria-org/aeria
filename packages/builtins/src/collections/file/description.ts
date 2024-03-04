import { defineDescription } from '@aeriajs/api'
import { getConfig } from '@aeriajs/entrypoint'

const link = async (_id: string) => {
  const config = await getConfig()
  return `${config.apiUrl || ''}/file/${_id}`
}

const timestamp = (lastModified: Date | undefined) => lastModified
  ? new Date(lastModified).getTime()
  : 'fresh'

export const description = defineDescription({
  $id: 'file',
  owned: 'always',
  presets: ['owned'],
  indexes: [
    'filename',
    'link',
    'mime',
  ],
  properties: {
    mime: {
      type: 'string',
    },
    size: {
      type: 'number',
    },
    last_modified: {
      type: 'string',
      format: 'date-time',
    },
    filename: {
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
      getter: async (value: any) => {
        return `${await link(value._id)}/${timestamp(value.last_modified)}`
      },
    },
    download_link: {
      getter: async (value: any) => {
        return `${await link(value._id)}/download/${timestamp(value.last_modified)}`
      },
    },
  },
  actions: {
    deleteAll: {
      name: 'Remover',
      ask: true,
      selection: true,
    },
  },
  individualActions: {
    remove: {
      name: 'Remover',
      icon: 'trash',
      ask: true,
    },
  },
})
