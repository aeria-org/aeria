import type { Collection } from '.'

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

export type Role<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection> = any,
> = {
  inherit?: readonly (keyof TAccessControl['roles'])[]
  grantEverything?: boolean
  grant?: readonly (keyof TCollection['functions'])[]
  forbid?: readonly (keyof TCollection['functions'])[]
}

export type AccessControl<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection, TAccessControl> = any,
> = {
  roles?: Partial<Record<
    string,
    Role<TCollection, TAccessControl>
  >>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type NonCircularAccessControl<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection, TAccessControl> = any,
> = {
  roles?: Record<
    string,
    Role<TCollection, TAccessControl>
  >
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

