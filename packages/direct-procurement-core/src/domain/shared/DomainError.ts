/** İş kuralı ihlali. UI, `code` ile kullanıcıya anlamlı mesaj gösterebilir. */
export class DomainError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
