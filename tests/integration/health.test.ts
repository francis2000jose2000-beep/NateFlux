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

describe('GET /health', () => {
  it('returns ok', async () => {
    const repo = new InMemoryAuditRepository()
    const useCase = new CreateAuditEvent(repo, new FixedId(), new FixedClock())
    const app = createApp({
      logger: pino({ level: 'silent' }),
      createAuditEvent: useCase
    })

    const res = await request(app).get('/health')
    const body = res.body as { status: string }
    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
  })
})
