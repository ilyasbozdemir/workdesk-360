import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, isHashedPassword } from '../authCrypto'

describe('authCrypto', () => {
  it('hashes with a random salt and verifies the correct password', () => {
    const a = hashPassword('Sifre123')
    const b = hashPassword('Sifre123')
    expect(a).not.toBe(b)
    expect(isHashedPassword(a)).toBe(true)
    expect(a).not.toContain('Sifre123')
    expect(verifyPassword('Sifre123', a)).toBe(true)
    expect(verifyPassword('yanlis', a)).toBe(false)
  })

  it('rejects an old password against a newly hashed one', () => {
    const current = hashPassword('yeniParola')
    expect(verifyPassword('eskiParola', current)).toBe(false)
  })

  it('still matches legacy plaintext (for transparent upgrade) but never empty values', () => {
    expect(isHashedPassword('legacy')).toBe(false)
    expect(verifyPassword('legacy', 'legacy')).toBe(true)
    expect(verifyPassword('', '')).toBe(false)
    expect(verifyPassword('x', undefined)).toBe(false)
  })
})
