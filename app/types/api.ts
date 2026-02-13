export interface ApiErrorPayload {
  status: number
  code: string
  message: string
  details?: unknown
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  error: ApiErrorPayload
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(error: ApiErrorPayload) {
    super(error.message)
    this.name = "ApiClientError"
    this.status = error.status
    this.code = error.code
    this.details = error.details
  }
}
