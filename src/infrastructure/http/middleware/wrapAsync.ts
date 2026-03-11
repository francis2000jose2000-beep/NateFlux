import type { NextFunction, Request, RequestHandler, Response } from 'express'

export function wrapAsync(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next)
  }
}

