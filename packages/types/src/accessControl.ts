export type UserRole =
  | Collections['user']['item']['roles'][number]
  | 'root'
  | 'guest'

export type AccessCondition =
  | readonly UserRole[]
  | boolean
  | 'unauthenticated'
  | 'unauthenticated-only'

export type AcceptedRole =
  | UserRole
  | UserRole[]
  | null
  | unknown

export enum ACErrors {
  AssetNotFound = 'ASSET_NOT_FOUND',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  AuthorizationError = 'AUTHORIZATION_ERROR',
  FunctionNotFound = 'FUNCTION_NOT_FOUND',
  FunctionNotExposed = 'FUNCTION_NOT_EXPOSED',
  ImmutabilityIncorrectChild = 'IMMUTABILITY_INCORRECT_CHILD',
  ImmutabilityParentNotFound = 'IMMUTABILITY_PARENT_NOT_FOUND',
  ImmutabilityTargetImmutable = 'IMMUTABILITY_TARGET_IMMUTABLE',
  InvalidLimit = 'INVALID_LIMIT',
  OwnershipError = 'OWNERSHIP_ERROR',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
}

export const ACErrorMessages: Record<ACErrors, string> = {
  [ACErrors.AssetNotFound]: 'collection has no registered functions',
  [ACErrors.AuthenticationError]: 'you have insufficient privileges',
  [ACErrors.AuthorizationError]: 'you have insufficient privileges',
  [ACErrors.FunctionNotFound]: 'function not found',
  [ACErrors.FunctionNotExposed]: 'function not exposed',
  [ACErrors.ImmutabilityIncorrectChild]: 'specified limit is invalid',
  [ACErrors.ImmutabilityParentNotFound]: 'specified limit is invalid',
  [ACErrors.ImmutabilityTargetImmutable]: 'specified limit is invalid',
  [ACErrors.InvalidLimit]: 'specified limit is invalid',
  [ACErrors.OwnershipError]: 'you have insufficient privileges',
  [ACErrors.ResourceNotFound]: 'collection not found',
}

