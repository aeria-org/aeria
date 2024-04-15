export const extractIcons = (target: any): string[] => {
  if( !target || typeof target !== 'object' ) {
    return []
  }

  const foundIcons: string[] = []
  const icon = target.icon || target.icon

  if( icon ) {
    foundIcons.push(icon)
  }

  for( const child of Object.values(target) ) {
    foundIcons.push(...extractIcons(child))
  }

  return foundIcons
}

export const iconsEsmContent = (icons: string[]) => {
  const content = `export const icons = ${JSON.stringify(icons)};\n`
  return content
}

export const iconsCjsContent = (icons: string[]) => {
  const content = `exports.icons = ${JSON.stringify(icons)};\n`
  return content
}

export const iconsDtsContent = (icons: string[]) => {
  const types = icons.map((icon) => `  | '${icon}'`)
  const lines = [
    `export type UsedIcons = (\n${types.join('\n')})[];`,
    'export declare const icons: UsedIcons;',
  ]

  return lines.join('\n') + '\n'
}

