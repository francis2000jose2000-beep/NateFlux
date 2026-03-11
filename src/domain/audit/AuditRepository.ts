import type { AuditEvent } from './AuditEvent'

export interface AuditRepository {
  save(event: AuditEvent): Promise<void>
  getById(id: string): Promise<AuditEvent | null>
}

