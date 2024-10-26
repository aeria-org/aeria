import { ACError } from './accessControl.js'
import { HTTPStatus } from './http.js'
import { endpointErrorSchema } from './resultSchemas.js'
import { ValidationErrorCode, TraverseError } from './validation.js'

export const insertErrorSchema = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.Forbidden,
    HTTPStatus.NotFound,
    HTTPStatus.UnprocessableContent,
    HTTPStatus.BadRequest,
  ],
  code: [
    ACError.InsecureOperator,
    ACError.OwnershipError,
    ACError.ResourceNotFound,
    ACError.TargetImmutable,
    ACError.MalformedInput,
    ValidationErrorCode.EmptyTarget,
    ValidationErrorCode.InvalidProperties,
    ValidationErrorCode.MissingProperties,
    TraverseError.InvalidDocumentId,
    TraverseError.InvalidTempfile,
  ],
})

export const getErrorSchema = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.Forbidden,
    HTTPStatus.NotFound,
    HTTPStatus.BadRequest,
  ],
  code: [
    ACError.ResourceNotFound,
    ACError.OwnershipError,
    ACError.InsecureOperator,
    ACError.MalformedInput,
  ],
})

export const getAllErrorSchema = () => endpointErrorSchema({
  httpStatus: [HTTPStatus.Forbidden],
  code: [
    ACError.OwnershipError,
    ACError.InsecureOperator,
    ACError.InvalidLimit,
  ],
})

export const countErrorSchema = () => endpointErrorSchema({
  httpStatus: [HTTPStatus.Forbidden],
  code: [
    ACError.OwnershipError,
    ACError.InvalidLimit,
  ],
})

