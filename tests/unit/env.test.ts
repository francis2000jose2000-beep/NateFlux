import { describe, expect, it } from 'vitest'
import { loadEnv } from '../../src/config/env'

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({})
    expect(env.PORT).toBe(3000)
    expect(env.NODE_ENV).toBe('development')
  })

  it('rejects invalid PORT', () => {
    expect(() => loadEnv({ PORT: '70000' })).toThrow(/Invalid environment variables/i)
  })
})

