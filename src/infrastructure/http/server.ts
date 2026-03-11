import type { Express } from 'express'
import type { Logger } from 'pino'
import type { Server } from 'node:http'

export async function startServer(app: Express, logger: Logger, port: number): Promise<Server> {
  return new Promise<Server>((resolve) => {
    const server = app.listen(port, () => {
      logger.info({ port }, 'HTTP server listening')
      resolve(server)
    })
  })
}

export type GracefulShutdownOptions = {
  server: Server
  logger: Logger
  timeoutMs?: number
}

/**
 * Handles SIGTERM/SIGINT to support orchestrator-driven shutdown.
 *
 * OCI Container Instances (and most container runtimes) use SIGTERM to request
 * a graceful stop. We stop accepting new connections and allow in-flight
 * requests to finish before exiting.
 */
export function enableGracefulShutdown(options: GracefulShutdownOptions): void {
  const timeoutMs = options.timeoutMs ?? 10_000
  let shuttingDown = false

  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    options.logger.info({ signal }, 'Shutdown signal received')

    const timeout = setTimeout(() => {
      options.logger.error({ timeoutMs }, 'Graceful shutdown timed out')
      process.exit(1)
    }, timeoutMs)
    timeout.unref()

    options.server.close((err) => {
      if (err) {
        options.logger.error({ err }, 'Error during HTTP server shutdown')
        process.exitCode = 1
      }

      options.logger.info('HTTP server closed')
      clearTimeout(timeout)
    })
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'))
  process.once('SIGINT', () => shutdown('SIGINT'))
}
