import type { RequestHandler } from 'express'
import type { ZodSchema } from 'zod'
import { HttpError } from '../errors/HttpError'

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      next(
        new HttpError({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten()
        })
      )
      return
    }

    req.body = parsed.data
    next()
  }
}

