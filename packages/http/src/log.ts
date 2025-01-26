import type { GenericResponse } from '@aeriajs/types'
import { escape, AnsiColor, METHOD_COLORS } from '@aeriajs/common'

export const logResponse = (response: GenericResponse) => {
  const { statusCode, req: { method, url } } = response
  if( !method ) {
    return
  }

  const statusColor = statusCode >= 400 && statusCode <= 599
    ? AnsiColor.Red
    : AnsiColor.White

  const methodColor = method in METHOD_COLORS
    ? METHOD_COLORS[method]
    : AnsiColor.White

  const now = new Date()
  let line = `[${escape(statusColor, statusCode.toString())}] `
  line += `[${now.toLocaleString()}] `
  line += escape([
    '[1m',
    methodColor,
  ], method) + ' '
  line += url

  console.log(line)
}
