export type CollectionHookReadPayload = {
  filters: Record<string, any>
  sort?: Record<string, any>
  limit?: number
  offset?: number
}

export type CollectionHookWritePayload = {
  what: Record<string, any>
}

