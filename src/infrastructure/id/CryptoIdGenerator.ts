import type { IdGenerator } from '../../application/common/IdGenerator'
import { randomUUID } from 'node:crypto'

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID()
  }
}

