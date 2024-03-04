export type DateFormatOptions = {
  hours?: boolean
  hoursOnly?: boolean
  locale?: string
}

const rtf = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})

const units = {
  year: 31536000000,
  month: 2628000000,
  day: 86400000,
  hour: 3600000,
  minute: 6000,
  second: 1000,
}

export const formatDateTime = function(date: Date | string, options?: DateFormatOptions) {
  const target = date instanceof Date
    ? date
    : new Date(date)

  if( isNaN(target.getDate()) ) {
    return '-'
  }

  const {
    hours,
    hoursOnly,
    locale = 'navigator' in globalThis
      ? navigator.language
      : 'en-US',
  } = options || {}

  if( hoursOnly ) {
    return target.toLocaleTimeString()
  }

  return hours
    ? target.toLocaleString(locale)
    : target.toLocaleDateString(locale)
}

export const getRelativeTimeFromNow = function(target: any) {
  const now = new Date()
  const elapsed = now as any - target

  for( const [u, value] of Object.entries(units) ) {
    if( Math.abs(elapsed) > value || u === 'second' ) {
      return rtf.format(-1 * Math.round(elapsed / value), u as Intl.RelativeTimeFormatUnit)
    }
  }
}
