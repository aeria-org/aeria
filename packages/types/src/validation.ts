export enum ValidationErrorCode {
  InvalidProperties = 'INVALID_PROPERTIES',
  MissingProperties = 'MISSING_PROPERTIES',
  EmptyTarget = 'EMPTY_TARGET',
}

export type PropertyValidationErrorType =
  | 'missing'
  | 'extraneous'
  | 'unmatching'
  | 'extraneous_element'
  | 'numeric_constraint'

export type PropertyValidationError = {
  type: PropertyValidationErrorType
  index?: number
  details: {
    expected: any
    got: string
  }
}

export type ValidationErrorInvalidProperties = {
  code: ValidationErrorCode.InvalidProperties
  errors: Record<string, PropertyValidationError | ValidationError>
}

export type ValidationErrorMissingProperties = {
  code: ValidationErrorCode.MissingProperties
  errors: Record<string, { type: 'missing' }>
}

export type ValidationErrorEmptyTarget = {
  code: ValidationErrorCode.EmptyTarget
  errors: {}
}

export type ValidationError =
  | ValidationErrorInvalidProperties
  | ValidationErrorMissingProperties
  | ValidationErrorEmptyTarget

