import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info')
})

export type AppEnv = z.infer<typeof EnvSchema>

/**
 * Validates runtime configuration once, early.
 *
 * The coercion behavior (e.g. PORT) is intentional to support container/env var usage
 * without requiring users to manage types manually.
 */
export function loadEnv(input: NodeJS.ProcessEnv): AppEnv {
  const parsed = EnvSchema.safeParse(input)
  if (!parsed.success) {
    const error = new Error(`Invalid environment variables: ${parsed.error.message}`)
    ;(error as Error & { cause?: unknown }).cause = parsed.error
    throw error
  }

  return parsed.data
}

