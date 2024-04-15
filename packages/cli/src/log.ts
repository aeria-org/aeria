type EntryType =
  | 'info'
  | 'error'
  | 'success'
  | 'warning'

const makeLine = (type: EntryType, message: string) => {
  return `[${type}]: ${message}`
}

export const log = (type: EntryType, message: string) => {
  const line = makeLine(type, message)
  process.stdout.write(line + '\n')
}
