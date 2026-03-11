import type { AuditRepository } from '../../domain/audit/AuditRepository'
import type { AuditEvent } from '../../domain/audit/AuditEvent'

export class InMemoryAuditRepository implements AuditRepository {
  private readonly eventsById = new Map<string, AuditEvent>()

  save(event: AuditEvent): Promise<void> {
    this.eventsById.set(event.id, event)
    return Promise.resolve()
  }

  getById(id: string): Promise<AuditEvent | null> {
    return Promise.resolve(this.eventsById.get(id) ?? null)
  }
}
