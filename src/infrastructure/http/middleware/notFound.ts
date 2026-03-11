import type { RequestHandler } from 'express'
import { HttpError } from '../errors/HttpError'

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new HttpError({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.path}`
    })
  )
}

