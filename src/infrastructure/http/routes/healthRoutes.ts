import type { Router } from 'express'

export function registerHealthRoutes(router: Router): void {
  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    })
  })
}

