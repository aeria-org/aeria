import { defineDescription, ObjectId } from '@aeriajs/core'
import { getFileLink } from '../file/description.js'

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
  unique: ['email'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
    },
    given_name: {
      getter: (doc: object) => {
        if( 'name' in doc && typeof doc.name === 'string' ) {
          return doc.name.split(' ')[0]
        }
      },
    },
    family_name: {
      getter: (doc: object) => {
        if( 'name' in doc && typeof doc.name === 'string' ) {
          return doc.name.split(' ')[1]
        }
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
      minItems: 1,
    },
    email: {
      type: 'string',
      inputType: 'email',
      minLength: 3,
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
      getter: (doc: object) => {
        if( 'picture_file' in doc && doc.picture_file && typeof doc.picture_file === 'object' && '_id' in doc.picture_file && doc.picture_file._id instanceof ObjectId ) {
          return getFileLink(doc.picture_file._id)
        }
      },
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
    changePassword: {
      label: 'change_password',
      icon: 'key',
      translate: true,
      route: {
        name: '/dashboard/user/changepass',
        fetchItem: true,
      },
    },
    'copyRedefinePasswordLink': {
      label: 'copy_redefine_password_link',
      icon: 'link',
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

