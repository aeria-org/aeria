import type { UserRole } from './token.js'

export type AccessCondition =
  | readonly UserRole[]
  | boolean
  | 'unauthenticated'
  | 'unauthenticated-only'

export type RoleFromAccessCondition<TAccessCondition extends AccessCondition | undefined> = undefined extends TAccessCondition
  ? null
  : TAccessCondition extends readonly (infer Role)[]
    ? Role
    : TAccessCondition extends true
      ? Exclude<UserRole, 'unauthenticated'>
      : TAccessCondition extends false
        ? never
        : TAccessCondition extends 'unauthenticated-only'
          ? 'unauthenticated'
          : TAccessCondition extends 'unauthenticated'
            ? UserRole
            : never

export enum ACError {
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

export const ACErrorMessages: Record<ACError, string> = {
  [ACError.AssetNotFound]: 'collection has no registered functions',
  [ACError.AuthenticationError]: 'you have insufficient privileges',
  [ACError.AuthorizationError]: 'you have insufficient privileges',
  [ACError.FunctionNotFound]: 'function not found',
  [ACError.FunctionNotExposed]: 'function not exposed',
  [ACError.ImmutabilityIncorrectChild]: 'specified limit is invalid',
  [ACError.ImmutabilityParentNotFound]: 'specified limit is invalid',
  [ACError.ImmutabilityTargetImmutable]: 'specified limit is invalid',
  [ACError.InvalidLimit]: 'specified limit is invalid',
  [ACError.OwnershipError]: 'you have insufficient privileges',
  [ACError.ResourceNotFound]: 'collection not found',
}

