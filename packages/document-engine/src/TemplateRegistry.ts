import { DocumentDefinition, InstitutionalHeaderData } from './types/contracts'

/**
 * Mükerrer Şablon Kayıt Hatası
 */
export class DuplicateTemplateRegistrationError extends Error {
  readonly templateKey: string

  constructor(templateKey: string) {
    super(
      `Şablon zaten kayıtlı: "${templateKey}". Aynı anahtarla mükerrer kayıt yapılamaz. Yeniden yazmak için { allowOverride: true } seçeneğini kullanınız.`
    )
    this.name = 'DuplicateTemplateRegistrationError'
    this.templateKey = templateKey
  }
}

/**
 * Geçersiz veya Bilinmeyen Şablon Hatası
 */
export class InvalidTemplateKeyError extends Error {
  readonly templateKey: string

  constructor(templateKey: string) {
    super(`Bilinmeyen veya geçersiz şablon kimliği: "${templateKey}". Kayıtlı bir şablon bulunamadı.`)
    this.name = 'InvalidTemplateKeyError'
    this.templateKey = templateKey
  }
}

/**
 * Kayıt Seçenekleri
 */
export interface RegisterOptions {
  /**
   * Zaten kayıtlı bir şablon anahtarı varsa üzerine yazmaya izin verir.
   * Varsayılan: false (DuplicateTemplateRegistrationError fırlatılır).
   */
  allowOverride?: boolean
}

/**
 * Bağımsız, Instance Tabanlı ve Duplicate Korumalı Şablon Kayıt Defteri (TemplateRegistry)
 * - Herhangi bir sektörel veya uygulamaya özgü şablon bilgisi içermez.
 * - Çoklu uygulama izolasyonu için 'new TemplateRegistry()' ile örneklenebilir.
 * - Varsayılan küresel tekil deftere 'TemplateRegistry.default' üzerinden erişilebilir.
 * - Aynı anahtarla mükerrer kayıt yapılmasını varsayılan olarak engeller.
 */
export class TemplateRegistry {
  private definitions = new Map<string, DocumentDefinition<any>>()

  /**
   * Şablon anahtarlarını kanonik formata normalize eder (.html silinir, kırpılır, küçük harfe dönüştürülür).
   */
  static normalizeKey(key: string): string {
    if (!key || typeof key !== 'string') return ''
    return key
      .trim()
      .toLowerCase()
      .replace(/\.html$/i, '')
      .replace(/\.mustache$/i, '')
  }

  /**
   * @purpose Şablon tanımını ve ilişkili resolver/renderer ikilisini TemplateRegistry defterine kaydeder.
   * @source Uygulama ve paket başlatıcıları (registerTeminTemplates vb.)
   * @scope Monorepo geneli, çoklu uygulama kayıt defteri
   * @usedBy registerTeminTemplates, e2e/unit testler
   * @see packages/document-templates/src/engine/registerTeminTemplates.ts
   *
   * Tekil kayıt sistemidir; mükerrer veya paralel ikinci kayıt defteri oluşturulmamalıdır.
   */
  register<TData = any>(def: DocumentDefinition<TData>, options: RegisterOptions = {}): void {
    if (!def || !def.templateKey) {
      throw new Error('Geçersiz şablon tanımı: templateKey zorunludur.')
    }

    const canonical = TemplateRegistry.normalizeKey(def.templateKey)
    if (!canonical) {
      throw new Error(`Geçersiz şablon anahtarı: "${def.templateKey}"`)
    }

    if (this.has(canonical) && !options.allowOverride) {
      throw new DuplicateTemplateRegistrationError(def.templateKey)
    }

    // Ana tanımı sakla
    this.definitions.set(canonical, def)

    // snake_case ve kebab-case alternatiflerini bağla
    const snake = canonical.replace(/-/g, '_')
    const kebab = canonical.replace(/_/g, '-')
    this.definitions.set(snake, def)
    this.definitions.set(kebab, def)
  }

  /**
   * Kayıtlı bir şablona ek ad (alias) bağlar. Örn. registry anahtarı `luzum_onay_eki`,
   * şablon kimliği `luzum-muzekkeresi-onay-eki` olduğunda her iki ad da çözümlenir.
   * Hedef şablon kayıtlı değilse sessizce yok sayılmaz; hata fırlatılır.
   */
  registerAlias(alias: string, targetKey: string): void {
    const canonicalAlias = TemplateRegistry.normalizeKey(alias)
    if (!canonicalAlias) return
    const def = this.get(targetKey)
    this.definitions.set(canonicalAlias, def)
    this.definitions.set(canonicalAlias.replace(/-/g, '_'), def)
    this.definitions.set(canonicalAlias.replace(/_/g, '-'), def)
  }

  /**
   * Birden fazla belge tanımını topluca kaydeder.
   */
  registerMany(defs: DocumentDefinition<any>[], options: RegisterOptions = {}): void {
    for (const def of defs) {
      this.register(def, options)
    }
  }

  /**
   * @purpose Şablon anahtarına göre tip güvenli belge tanımını döner.
   * @source TemplateRegistry dahili eşleme haritası
   * @scope templateKey (snake_case / kebab-case normalizasyonu destekler)
   * @usedBy DocumentEngine.resolveDocumentData, DocumentEngine.compileHtml, DocumentRenderer
   * @see packages/document-engine/src/DocumentEngine.ts
   */
  get<TData = any, THeader = InstitutionalHeaderData>(
    templateKey: string
  ): DocumentDefinition<TData, THeader> {
    if (!templateKey || typeof templateKey !== 'string' || templateKey.trim() === '') {
      throw new InvalidTemplateKeyError(String(templateKey))
    }

    const canonical = TemplateRegistry.normalizeKey(templateKey)
    const found =
      this.definitions.get(canonical) ||
      this.definitions.get(canonical.replace(/-/g, '_')) ||
      this.definitions.get(canonical.replace(/_/g, '-'))

    if (!found) {
      throw new InvalidTemplateKeyError(templateKey)
    }

    return found as DocumentDefinition<TData, THeader>
  }

  /**
   * Belirtilen şablonun kayıtlı olup olmadığını kontrol eder.
   */
  has(templateKey: string): boolean {
    if (!templateKey || typeof templateKey !== 'string' || templateKey.trim() === '') {
      return false
    }

    const canonical = TemplateRegistry.normalizeKey(templateKey)
    return (
      this.definitions.has(canonical) ||
      this.definitions.has(canonical.replace(/-/g, '_')) ||
      this.definitions.has(canonical.replace(/_/g, '-'))
    )
  }

  /**
   * Kayıtlı tüm tekil belge tanımlarını döner.
   */
  getAll(): DocumentDefinition[] {
    const unique = new Map<string, DocumentDefinition>()
    for (const def of this.definitions.values()) {
      unique.set(TemplateRegistry.normalizeKey(def.templateKey), def)
    }
    return Array.from(unique.values())
  }

  /**
   * Belirtilen şablonu kayıt defterinden kaldırır.
   */
  unregister(templateKey: string): boolean {
    const canonical = TemplateRegistry.normalizeKey(templateKey)
    if (!canonical) return false

    const snake = canonical.replace(/-/g, '_')
    const kebab = canonical.replace(/_/g, '-')

    const had = this.definitions.has(canonical)
    this.definitions.delete(canonical)
    this.definitions.delete(snake)
    this.definitions.delete(kebab)
    return had
  }

  /**
   * Kayıt defterini tamamen temizler.
   */
  clear(): void {
    this.definitions.clear()
  }

  // =========================================================================
  // KÜRESEL VARSAYILAN TEKİL ERİŞİM VE GERİYE DÖNÜK UYUMLULUK KÖPRÜSÜ
  // =========================================================================

  private static defaultInstance: TemplateRegistry = new TemplateRegistry()

  /**
   * Küresel varsayılan kayıt defteri örneğini döner.
   */
  static get default(): TemplateRegistry {
    return this.defaultInstance
  }

  /**
   * Varsayılan kayıt defterine şablon ekler.
   */
  static register<TData = any>(def: DocumentDefinition<TData>, options?: RegisterOptions): void {
    this.defaultInstance.register(def, options)
  }

  /**
   * Varsayılan kayıt defterine topluca şablon ekler.
   */
  static registerMany(defs: DocumentDefinition<any>[], options?: RegisterOptions): void {
    this.defaultInstance.registerMany(defs, options)
  }

  /**
   * Varsayılan kayıt defterinden şablon çeker.
   */
  static get<TData = any, THeader = InstitutionalHeaderData>(
    templateKey: string
  ): DocumentDefinition<TData, THeader> {
    return this.defaultInstance.get<TData, THeader>(templateKey)
  }

  /**
   * Varsayılan kayıt defterinde şablonun varlığını kontrol eder.
   */
  static has(templateKey: string): boolean {
    return this.defaultInstance.has(templateKey)
  }

  /**
   * Varsayılan kayıt defterindeki tüm şablonları döner.
   */
  static getAll(): DocumentDefinition[] {
    return this.defaultInstance.getAll()
  }

  /**
   * Varsayılan kayıt defterinden şablon siler.
   */
  static unregister(templateKey: string): boolean {
    return this.defaultInstance.unregister(templateKey)
  }

  /**
   * Varsayılan kayıt defterini sıfırlar.
   */
  static clear(): void {
    this.defaultInstance.clear()
  }
}
