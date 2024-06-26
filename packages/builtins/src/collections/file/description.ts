import { defineDescription } from '@aeriajs/core'
import { getConfig } from '@aeriajs/entrypoint'

const link = async (_id: string) => {
  const config = await getConfig()
  return `${config.publicUrl || ''}/file/${_id}`
}

const timestamp = (lastModified: Date | undefined) => lastModified
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
