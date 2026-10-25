import crypto from 'crypto'

const PREFIX = 'scrypt$'
const KEY_LEN = 64

/** Değerin hash formatında (scrypt$salt$hash) saklanıp saklanmadığını döner. */
export function isHashedPassword(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX) && value.split('$').length === 3
}

/** Parolayı rastgele tuz ile scrypt kullanarak hashler. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString('hex')
  return `${PREFIX}${salt}$${hash}`
}

/**
 * Parolayı saklanan değerle karşılaştırır.
 * Saklanan değer hash değilse (eski düz metin kayıt) sabit zamanlı karşılaştırma yapılır;
 * çağıran taraf başarılı eşleşmede kaydı hash'e yükseltmelidir.
 */
export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (!stored || typeof password !== 'string' || password.length === 0) return false
  if (isHashedPassword(stored)) {
    const [, salt, hash] = stored.split('$')
    try {
      const expected = Buffer.from(hash, 'hex')
      const actual = crypto.scryptSync(password, salt, expected.length)
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
    } catch {
      return false
    }
  }
  const a = crypto.createHash('sha256').update(password).digest()
  const b = crypto.createHash('sha256').update(stored).digest()
  return crypto.timingSafeEqual(a, b)
}
