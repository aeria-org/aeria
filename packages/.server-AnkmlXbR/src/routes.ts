import type { RouteContext } from '@aeriajs/types'
import { createRouter } from '@aeriajs/http'
import { createContext } from '@aeriajs/core'
import { builtinFunctions } from '@aeriajs/builtins'
import { safeHandle, regularVerb, customVerbs } from './handler.js'

export const registerRoutes = () => {
  const defaultHandler = (fn: ReturnType<typeof regularVerb>) => {
    return (context: RouteContext) => safeHandle(fn, context)()
  }

  const router = createRouter({
    exhaust: true,
  })

  router.route([
    'POST',
    'GET',
  ], '/describe', builtinFunctions.describe)

  router.GET('/file/(\\w+)((/(\\w+))*)', defaultHandler(async (parentContext) => {
    const context = await createContext({
      collectionName: 'file',
      parentContext,
    })

    const [fileId, optionsString] = context.request.fragments
    const options = optionsString.split('/').filter((option) => option === 'picture' || option === 'download')

    return context.collections.file.functions.download({
      fileId,
      options,
    })
  }))

  router.GET('/(\\w+)/id/(\\w+)', defaultHandler(regularVerb('get')))
  router.GET('/(\\w+)', defaultHandler(regularVerb('getAll')))
  router.POST('/(\\w+)', defaultHandler(regularVerb('insert')))
  router.DELETE('/(\\w+)/(\\w+)', defaultHandler(regularVerb('remove')))
  router.route([
    'POST',
    'GET',
  ], '/(\\w+)/(\\w+)', defaultHandler(customVerbs()))

  return router
}
