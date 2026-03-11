import express, { type Express } from 'express'
import pinoHttp from 'pino-http'
import type { Logger } from 'pino'
import type { CreateAuditEvent } from '../../application/audit/CreateAuditEvent'
import { registerHealthRoutes } from './routes/healthRoutes'
import { registerAuditRoutes } from './routes/auditRoutes'
import { notFound } from './middleware/notFound'
import { createErrorHandler } from './middleware/errorHandler'

export type AppDependencies = {
  logger: Logger
  createAuditEvent: CreateAuditEvent
}

export function createApp(deps: AppDependencies): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    pinoHttp({
      logger: deps.logger,
      quietReqLogger: true
    })
  )

  app.use(express.json({ limit: '256kb' }))

  const router = express.Router()
  registerHealthRoutes(router)
  registerAuditRoutes(router, { createAuditEvent: deps.createAuditEvent })
  app.use(router)

  app.use(notFound)
  app.use(createErrorHandler(deps.logger))

  return app
}

