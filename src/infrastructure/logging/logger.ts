import pino, { type Logger } from 'pino'
import type { AppEnv } from '../../config/env'

export function createLogger(env: AppEnv): Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: null,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]'
      ],
      remove: true
    }
  })
}
