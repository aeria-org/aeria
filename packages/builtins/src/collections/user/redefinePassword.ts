import type { Context } from '@aeriajs/types'
import type { description } from './description.js'
import { decodeToken, ObjectId } from '@aeriajs/core'
import { Result, ACError, HTTPStatus } from '@aeriajs/types'
import * as bcrypt from 'bcrypt'

export enum ActivationError {
  UserNotFound = 'USER_NOT_FOUND',
  UserNotActive = 'USER_NOT_ACTIVE',
  InvalidLink = 'INVALID_LINK',
  InvalidToken = 'INVALID_TOKEN'
}

export const redefinePassword = async (
    payload:{
        password?: string
        userId?:string
        token?:string
    },
    context: Context<typeof description> 
) => {
    const {
        userId,
        token,
        password,
    } = payload

    if( !context.config.secret ) {
        throw new Error('config.secret is not set')
    }

    if( !userId || !token ) {
        return context.error(HTTPStatus.NotFound, {
            code: ActivationError.InvalidLink,
        })
    }

    const user = await context.collection.model.findOne({
        _id: new ObjectId(userId),
    }, {
        projection: {
            password: 1,
            active:1
        },
    })

    if( !user ) {
        return context.error(HTTPStatus.NotFound, {
            code: ActivationError.UserNotFound,
        })
    }

    if( !user.active ) {
        return context.error(HTTPStatus.Forbidden, {
            code: ActivationError.UserNotActive,
        })
    }
    const decoded = await decodeToken(token, context.config.secret)
    if(!decoded){
        return context.error(HTTPStatus.Unauthorized, {
            code: ActivationError.InvalidToken
        })
    }

    if( !password ) {
        /* if( context.request.method === 'GET' ) {
            return context.response.writeHead(302, {
                location: `/user/activation?step=password&u=${userId}&t=${token}`,
            }).end()
        } */
        return context.error(HTTPStatus.UnprocessableContent, {
            code: ACError.MalformedInput,
        })
    }

    await context.collection.model.updateOne(
        {
            _id: user._id,
        },
        {
            $set: {
                active: true,
                password: await bcrypt.hash(password, 10),
            },
        },
    )

  return Result.result({
    userId: user._id,
  })
}

