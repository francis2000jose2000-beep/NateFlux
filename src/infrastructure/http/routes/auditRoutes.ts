import type { Router } from 'express'
import { z } from 'zod'
import type { CreateAuditEvent } from '../../../application/audit/CreateAuditEvent'
import { validateBody } from '../middleware/validateBody'
import { wrapAsync } from '../middleware/wrapAsync'
import type { CreateAuditEventInput } from '../../../application/audit/CreateAuditEvent'

const CreateAuditSchema = z.object({
  actor: z.string().min(1).max(256),
  action: z.string().min(1).max(256),
  resource: z.string().min(1).max(1024),
  metadata: z.record(z.unknown()).optional()
})

type CreateAuditBody = z.infer<typeof CreateAuditSchema>

export function registerAuditRoutes(router: Router, deps: { createAuditEvent: CreateAuditEvent }): void {
  router.post(
    '/audit',
    validateBody(CreateAuditSchema),
    wrapAsync(async (req, res) => {
      const body = req.body as CreateAuditBody
      const input: CreateAuditEventInput = {
        actor: body.actor,
        action: body.action,
        resource: body.resource,
        ...(body.metadata ? { metadata: body.metadata } : {})
      }
      const result = await deps.createAuditEvent.execute(input)
      res.status(201).json({
        id: result.event.id,
        occurredAt: result.event.occurredAt.toISOString()
      })
    })
  )
}
