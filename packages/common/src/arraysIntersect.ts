export const arraysIntersect = <T extends any[] | readonly any[]>(subject: T | string, arr: T | undefined) => {
  if( !arr ) {
    return false
  }

  return Array.isArray(subject)
    ? subject.some((e) => arr.includes(e))
    : arr.includes(subject)
}
