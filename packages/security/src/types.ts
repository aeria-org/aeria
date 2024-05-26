import type { Context, Either, GetAllPayload, InsertPayload, ACError } from '@aeriajs/types'

export type SecurityCheckReadPayload = {
  filters: Record<string, any>
  sort?: Record<string, any>
  limit?: number
  offset?: number
}

export type SecurityCheckWritePayload = {
  what: Record<string, any>
}

export type SecurityCheckProps<TPayload extends Record<string, any> = any> = {
  propertyName?: string
  parentId?: string
  childId?: string
  payload: TPayload
}

export type SecurityCheck = (props: SecurityCheckProps, context: Context)=> Promise<Either<
  ACError,
  GetAllPayload<any> | InsertPayload<any>
>>
