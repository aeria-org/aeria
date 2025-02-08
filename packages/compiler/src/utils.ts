export type ArrayProperties<T> = keyof {
  [
  P in Extract<keyof T, string> as NonNullable<T[P]> extends string[] | readonly string[]
    ? P
    : never
  ]: never
}
