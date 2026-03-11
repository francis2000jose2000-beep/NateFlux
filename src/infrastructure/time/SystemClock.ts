import type { Clock } from '../../application/common/Clock'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

