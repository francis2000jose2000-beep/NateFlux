import type { AuditRepository } from '../../domain/audit/AuditRepository'
import type { Clock } from '../common/Clock'
import type { IdGenerator } from '../common/IdGenerator'
import type { AuditEvent } from '../../domain/audit/AuditEvent'

export type CreateAuditEventInput = {
  actor: string
  action: string
  resource: string
  metadata?: Record<string, unknown>
}

export type CreateAuditEventResult = {
  event: AuditEvent
}

export class CreateAuditEvent {
  constructor(
    private readonly repository: AuditRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async execute(input: CreateAuditEventInput): Promise<CreateAuditEventResult> {
    const event: AuditEvent = {
      id: this.idGenerator.generate(),
      actor: input.actor,
      action: input.action,
      resource: input.resource,
      occurredAt: this.clock.now(),
      ...(input.metadata ? { metadata: input.metadata } : {})
    }

    await this.repository.save(event)
    return { event }
  }
}
