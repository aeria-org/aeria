import type { Result, ACError, CollectionProps } from '@aeriajs/types'

export type ReadMiddlewareReturn<TProps extends CollectionProps<unknown>> = Promise<
  Result.Either<
    | typeof ACError.OwnershipError
    | typeof ACError.InvalidLimit,
    TProps
  >
>

export type WriteMiddlewareReturn<TProps extends CollectionProps<unknown>> = Promise<
  Result.Either<
    | typeof ACError.OwnershipError
    | typeof ACError.ResourceNotFound
    | typeof ACError.TargetImmutable,
    TProps
  >
>

