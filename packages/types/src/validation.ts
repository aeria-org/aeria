export enum ValidationErrorCode {
  InvalidProperties = 'INVALID_PROPERTIES',
  MissingProperties = 'MISSING_PROPERTIES',
  EmptyTarget = 'EMPTY_TARGET',
}

export enum PropertyValidationErrorCode {
  Missing = 'MISSING_PROPERTY',
  Extraneous = 'EXTRANEOUS_PROPERTY',
  Unmatching = 'UNMATCHING_PROPERTIES',
  ExtraneousElement = 'EXTRANEOUS_ELEMENT',
  MoreItemsExpected = 'MORE_ITEMS_EXPECTED',
  LessItemsExpected = 'LESS_ITEMS_EXPECTED',
  NumericConstraint = 'NUMERIC_CONSTRAINT',
  StringConstraint = 'STRING_CONSTRAINT',
}

export enum TraverseError {
  InvalidDocumentId = 'INVALID_DOCUMENT_ID',
  InvalidTempfile = 'INVALID_TEMPFILE',
}

export type PropertyValidationError = {
  type: PropertyValidationErrorCode
  index?: number
  details?: {
    expected: unknown
    got: unknown
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

