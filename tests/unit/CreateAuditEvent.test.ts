import { describe, expect, it } from 'vitest'
import { CreateAuditEvent } from '../../src/application/audit/CreateAuditEvent'
import type { AuditRepository } from '../../src/domain/audit/AuditRepository'
import type { AuditEvent } from '../../src/domain/audit/AuditEvent'
import type { Clock } from '../../src/application/common/Clock'
import type { IdGenerator } from '../../src/application/common/IdGenerator'

class StubRepo implements AuditRepository {
  saved: AuditEvent[] = []
  save(event: AuditEvent): Promise<void> {
    this.saved.push(event)
    return Promise.resolve()
  }
  getById(_id: string): Promise<AuditEvent | null> {
    return Promise.resolve(null)
  }
}

class StubClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return this.fixed
  }
}

class StubId implements IdGenerator {
  constructor(private readonly fixed: string) {}
  generate(): string {
    return this.fixed
  }
}

describe('CreateAuditEvent', () => {
  it('persists an audit event with generated id and timestamp', async () => {
    const repo = new StubRepo()
    const clock = new StubClock(new Date('2025-01-01T00:00:00.000Z'))
    const ids = new StubId('evt_123')
    const useCase = new CreateAuditEvent(repo, ids, clock)

    const result = await useCase.execute({
      actor: 'alice',
      action: 'LOGIN',
      resource: 'console'
    })

    expect(result.event).toEqual({
      id: 'evt_123',
      actor: 'alice',
      action: 'LOGIN',
      resource: 'console',
      occurredAt: new Date('2025-01-01T00:00:00.000Z'),
      metadata: undefined
    })
    expect(repo.saved).toHaveLength(1)
  })
})
