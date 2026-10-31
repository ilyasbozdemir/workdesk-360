import { TemplateKey, resolveTemplateKey } from '@temin360/document-templates'
import { DocumentDefinition } from './types/contracts'

/**
 * Bilinmeyen veya tanımsız şablon kimliği hatası
 */
export class InvalidTemplateKeyError extends Error {
  constructor(templateKey: string) {
    super(`Bilinmeyen veya geçersiz şablon kimliği: "${templateKey}". Kayıtlı bir şablon bulunamadı.`)
    this.name = 'InvalidTemplateKeyError'
  }
}

/**
 * Bağımsız Belge Şablon Kayıt Defteri (TemplateRegistry)
 * - Her şablonun kendine ait resolver, renderer ve metadata kaydını tutar.
 * - Bilinmeyen anahtarlar için açık hata fırlatır; sessiz yönlendirme yapmaz.
 * - UI veya masaüstü bağımlılığı içermez; saf TypeScript mimarisindedir.
 */
export class TemplateRegistry {
  private static definitions = new Map<string, DocumentDefinition<any>>()

  /**
   * Yeni bir belge tanımı kaydeder
   */
  static register<TData>(def: DocumentDefinition<TData>): void {
    const canonicalKey = (resolveTemplateKey(def.templateKey) as string) || def.templateKey
    this.definitions.set(canonicalKey, def)
    this.definitions.set(def.templateKey, def)
    this.definitions.set(def.templateKey.replace(/_/g, '-'), def)
    this.definitions.set(def.templateKey.replace(/-/g, '_'), def)
  }

  /**
   * Şablon anahtarına göre belge tanımını getirir.
   * Bilinmeyen anahtarlarda açık InvalidTemplateKeyError fırlatır.
   */
  static get<TData = any>(templateKey: string): DocumentDefinition<TData> {
    if (!templateKey || typeof templateKey !== 'string' || templateKey.trim() === '') {
      throw new InvalidTemplateKeyError(String(templateKey))
    }

    const cleanKey = templateKey.replace(/\.html$/i, '').trim()
    const canonical = (resolveTemplateKey(cleanKey) as string) || cleanKey

    const found =
      this.definitions.get(canonical) ||
      this.definitions.get(cleanKey) ||
      this.definitions.get(cleanKey.replace(/-/g, '_')) ||
      this.definitions.get(cleanKey.replace(/_/g, '-'))

    if (!found) {
      throw new InvalidTemplateKeyError(templateKey)
    }

    return found as DocumentDefinition<TData>
  }

  /**
   * Şablonun kayıtlı olup olmadığını kontrol eder
   */
  static has(templateKey: string): boolean {
    if (!templateKey) return false
    const cleanKey = templateKey.replace(/\.html$/i, '').trim()
    const canonical = (resolveTemplateKey(cleanKey) as string) || cleanKey
    return (
      this.definitions.has(canonical) ||
      this.definitions.has(cleanKey) ||
      this.definitions.has(cleanKey.replace(/-/g, '_')) ||
      this.definitions.has(cleanKey.replace(/_/g, '-'))
    )
  }

  /**
   * Tüm kayıtlı belge tanımlarını döner
   */
  static getAll(): DocumentDefinition[] {
    const unique = new Map<TemplateKey | string, DocumentDefinition>()
    this.definitions.forEach((def) => {
      unique.set(def.templateKey, def)
    })
    return Array.from(unique.values())
  }

  /**
   * Testler ve sıfırlama için defteri temizler
   */
  static clear(): void {
    this.definitions.clear()
  }
}

