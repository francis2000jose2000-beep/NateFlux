export type HttpErrorOptions = {
  statusCode: number
  code: string
  message: string
  details?: unknown
}

export class HttpError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(options: HttpErrorOptions) {
    super(options.message)
    this.name = 'HttpError'
    this.statusCode = options.statusCode
    this.code = options.code
    this.details = options.details
  }
}

