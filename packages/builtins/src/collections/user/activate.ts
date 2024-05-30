import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { ObjectId } from '@aeriajs/core'
import { HTTPStatus } from '@aeriajs/types'
import * as bcrypt from 'bcrypt'

export enum ActivationError {
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyActiveUser = 'ALREADY_ACTIVE_USER',
  InvalidLink = 'INVALID_LINK',
}

export const activate = async (
  payload: {
    password: string
  },
  context: Context<typeof description>,
) => {
  const {
    u: userId,
    t: token,
  } = context.request.query

  if( !userId || !token ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.InvalidLink,
    })
  }

  const user = await context.collection.model.findOne({
    _id: new ObjectId(<string>userId),
  }, {
    projection: {
      password: 1,
    },
  })

  if( !user ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.UserNotFound,
    })
  }
  if( user.active ) {
    return context.error(HTTPStatus.Forbidden, {
      code: ActivationError.AlreadyActiveUser,
    })
  }

  const equal = await bcrypt.compare(user._id.toString(), token)
  if( !equal ) {
    return context.error(HTTPStatus.NotFound, {
      code: ActivationError.InvalidLink,
    })
  }

  if( !user.password ) {
    if( !payload.password ) {
      return context.response.writeHead(302, {
        location: `/user/activation?step=password&u=${userId}&t=${token}`,
      })
    }

    await context.collection.model.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          active: true,
          password: await bcrypt.hash(payload.password, 10),
        },
      },
    )

    return
  }

  await context.collection.model.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        active: true,
      },
    },
  )

  return context.response.writeHead(302, {
    location: '/user/activation',
  })
}

