import type { Collection } from '.'

export enum ACErrors {
  AuthorizationError = 'AUTHORIZATION_ERROR',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  ImmutabilityIncorrectChild = 'IMMUTABILITY_INCORRECT_CHILD',
  ImmutabilityParentNotFound = 'IMMUTABILITY_PARENT_NOT_FOUND',
  ImmutabilityTargetImmutable = 'IMMUTABILITY_TARGET_IMMUTABLE',
  OwnershipError = 'OWNERSHIP_ERROR',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  AssetNotFound = 'ASSET_NOT_FOUND',
  FunctionNotFound = 'FUNCTION_NOT_FOUND',
  InvalidLimit = 'INVALID_LIMIT',
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

export type Roles<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection> = any,
> = Record<string, Role<TCollection, TAccessControl>>

export type InternalAccessControl<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection, TAccessControl> = any,
> = {
  roles?: Roles<TCollection, TAccessControl>
  availableRoles?: keyof TAccessControl['roles']
  parent?: TAccessControl['roles']
}

export type AccessControl<
  TCollection extends Collection = any,
  TAccessControl extends AccessControl<TCollection, TAccessControl> = any,
> = InternalAccessControl<TCollection, TAccessControl>

export type ACProfile = {
  readonly roles?: string[]
  readonly allowed_functions?: string[]
}

