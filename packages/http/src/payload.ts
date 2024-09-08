export const safeJson = (candidate: unknown) => {
  if( !candidate || typeof candidate !== 'string' ) {
    return candidate
  }

  const json = JSON.parse(candidate)
  if( json && typeof json === 'object' ) {
    delete json.constructor
    delete json.__proto__
  }
  return json
}

