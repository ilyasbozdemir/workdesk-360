import { describe, expect, it } from 'vitest'
import { isValidDateString } from '../hariciAktarimSchema'

describe('isValidDateString saat dilimi sınırları', () => {
  it.each([
    '2025-03-01T10:00:00-12:00',
    '2025-03-01T10:00:00-11:59',
    '2025-03-01T10:00:00+14:00',
    '2025-03-01T10:00:00+05:30',
    '2025-03-01T10:00:00Z'
  ])('geçerli: %s', (v) => {
    expect(isValidDateString(v)).toBe(true)
  })

  it.each([
    '2025-03-01T10:00:00-14:00',
    '2025-03-01T10:00:00-13:00',
    '2025-03-01T10:00:00-12:01',
    '2025-03-01T10:00:00+14:01',
    '2025-03-01T10:00:00+15:00',
    '2025-03-01T10:00:00+05:60'
  ])('geçersiz: %s', (v) => {
    expect(isValidDateString(v)).toBe(false)
  })
})
