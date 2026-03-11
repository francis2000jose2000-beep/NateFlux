import { describe, expect, it } from 'vitest'
import request from 'supertest'
import pino from 'pino'
import { createApp } from '../../src/infrastructure/http/app'
import { InMemoryAuditRepository } from '../../src/infrastructure/persistence/InMemoryAuditRepository'
import { CreateAuditEvent } from '../../src/application/audit/CreateAuditEvent'
import type { IdGenerator } from '../../src/application/common/IdGenerator'
import type { Clock } from '../../src/application/common/Clock'

class FixedId implements IdGenerator {
  generate(): string {
    return 'evt_test'
  }
}

class FixedClock implements Clock {
  now(): Date {
    return new Date('2025-01-01T00:00:00.000Z')
  }
}

describe('POST /audit', () => {
  it('rejects invalid body', async () => {
    const repo = new InMemoryAuditRepository()
    const useCase = new CreateAuditEvent(repo, new FixedId(), new FixedClock())
    const app = createApp({
      logger: pino({ level: 'silent' }),
      createAuditEvent: useCase
    })

    const res = await request(app).post('/audit').send({})
    const body = res.body as { code: string }
    expect(res.status).toBe(400)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('creates an audit event', async () => {
    const repo = new InMemoryAuditRepository()
    const useCase = new CreateAuditEvent(repo, new FixedId(), new FixedClock())
    const app = createApp({
      logger: pino({ level: 'silent' }),
      createAuditEvent: useCase
    })

    const res = await request(app)
      .post('/audit')
      .send({ actor: 'alice', action: 'LOGIN', resource: 'console', metadata: { ip: '1.2.3.4' } })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      id: 'evt_test',
      occurredAt: '2025-01-01T00:00:00.000Z'
    })
  })
})
