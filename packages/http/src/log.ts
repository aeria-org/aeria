import { METHOD_COLORS, type GenericResponse } from '@aeriajs/types'
import { styleText } from 'node:util'

export const logResponse = (response: GenericResponse) => {
  const { statusCode, req: { method, url } } = response
  if( !method ) {
    return
  }

  const statusColor = statusCode >= 400 && statusCode <= 599
    ? 'red'
    : 'white'

  const methodColor = method in METHOD_COLORS
    ? METHOD_COLORS[method as keyof typeof METHOD_COLORS]
    : 'white'

  const now = new Date()
  let line = `[${styleText([statusColor], statusCode.toString())}] `
  line += `[${now.toLocaleString()}] `
  line += styleText([
    'bold',
    methodColor,
  ], method) + ' '
  line += url

  console.log(line)
}

