import { defineDescription } from '@aeriajs/core'

/**
 * This description complies with JWT claims specified in RFC-7519.
 * Reference: https://www.iana.org/assignments/jwt/jwt.xhtml#claims
 */
export const description = defineDescription({
  $id: 'user',
  icon: 'users',
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
    },
  },
  individualActions: {
    'ui:spawnEdit': {
      label: 'action.edit',
      icon: 'pencil',
      translate: true,
    },
    'route:/dashboard/user/changepass': {
      label: 'change_password',
      icon: 'key',
      fetchItem: true,
      translate: true,
    },
    'copyActivationLink': {
      label: 'copy_activation_link',
      icon: 'link',
      translate: true,
    },
  },
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

