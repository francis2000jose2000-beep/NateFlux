import type { ErrorRequestHandler } from 'express'
import type { Logger } from 'pino'
import { HttpError } from '../errors/HttpError'

/**
 * Converts thrown errors into consistent JSON responses.
 *
 * The response always includes a stable `code` for clients and uses `details`
 * only for safe, non-sensitive diagnostics.
 */
export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({
        code: err.code,
        message: err.message,
        details: err.details
      })
      return
    }

    logger.error({ err }, 'Unhandled error')
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    })
  }
}

