import { loadEnv } from './config/env'
import { createLogger } from './infrastructure/logging/logger'
import { InMemoryAuditRepository } from './infrastructure/persistence/InMemoryAuditRepository'
import { CryptoIdGenerator } from './infrastructure/id/CryptoIdGenerator'
import { SystemClock } from './infrastructure/time/SystemClock'
import { CreateAuditEvent } from './application/audit/CreateAuditEvent'
import { createApp } from './infrastructure/http/app'
import { enableGracefulShutdown, startServer } from './infrastructure/http/server'

const env = loadEnv(process.env)
const logger = createLogger(env)

const auditRepository = new InMemoryAuditRepository()
const idGenerator = new CryptoIdGenerator()
const clock = new SystemClock()
const createAuditEvent = new CreateAuditEvent(auditRepository, idGenerator, clock)

const app = createApp({ logger, createAuditEvent })

startServer(app, logger, env.PORT)
  .then((server) => {
    enableGracefulShutdown({ server, logger })
  })
  .catch((err: unknown) => {
    logger.fatal({ err }, 'Failed to start server')
    process.exitCode = 1
  })
