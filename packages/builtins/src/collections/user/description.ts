import { defineDescription } from '@aeriajs/api'

/**
 * This description complies with JWT claims specified in RFC-7519.
 * Reference: https://www.iana.org/assignments/jwt/jwt.xhtml#claims
 */
export const description = defineDescription({
  $id: 'user',
  required: [
    'name',
    'roles',
    'email',
  ],
  form: [
    'name',
    'active',
    'roles',
    'email',
    'phone_number',
    'picture_file',
  ],
  indexes: ['name'],
  freshItem: {
    active: true,
  },
  properties: {
    name: {
      type: 'string',
    },
    given_name: {
      getter: (document: any) => {
        return `${document.name?.split(' ')[0] || 'N/A'}`
      },
    },
    family_name: {
      getter: (document: any) => {
        return `${document.name?.split(' ')[1]}`
      },
    },
    active: {
      type: 'boolean',
    },
    roles: {
      type: 'array',
      items: {
        type: 'string',
      },
      uniqueItems: true,
    },
    email: {
      type: 'string',
      inputType: 'email',
      unique: true,
    },
    password: {
      type: 'string',
      inputType: 'password',
      hidden: true,
    },
    phone_number: {
      type: 'string',
      mask: '(##) #####-####',
    },
    picture_file: {
      $ref: 'file',
      accept: ['image/*'],
    },
    picture: {
      getter: (value: any) => {
        return value.picture_file?.link
      },
    },
    group: {
      type: 'string',
    },
    self_registered: {
      type: 'boolean',
      readOnly: true,
    },
    // resources_usage: {
    //   type: 'object',
    //   additionalProperties: {
    //     $ref: 'resourceUsage',
    //     inline: true,
    //   },
    // },
    updated_at: {
      type: 'string',
      format: 'date-time',
    },
  },
  presets: [
    'crud',
    'view',
    'duplicate',
  ],
  layout: {
    name: 'grid',
    options: {
      title: 'name',
      badge: 'roles',
      picture: 'picture_file',
      information: 'email',
      active: 'active',
      translateBadge: true,
    },
  },
  individualActions: {
    'ui:spawnEdit': {
      name: 'Editar',
      icon: 'pencil',
    },
    'route:/dashboard/user/changepass': {
      name: 'Mudar senha',
      icon: 'key',
      fetchItem: true,
    },
  },
  icon: 'users',
  filters: [
    'name',
    'roles',
    'email',
    'phone_number',
  ],
  table: [
    'name',
    'roles',
    'picture_file',
    'active',
    'updated_at',
  ],
  tableMeta: ['email'],
  formLayout: {
    fields: {
      given_name: {
        span: 3,
      },
      family_name: {
        span: 3,
      },
    },
  },
})

