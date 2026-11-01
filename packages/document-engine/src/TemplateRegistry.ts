import React from 'react'
import {
  TemplateKey,
  resolveTemplateKey,
  templateRegistry as baseTemplateRegistry
} from '@temin360/document-templates'
import { DocumentDefinition } from './types/contracts'
import { LuzumMuzekkeresiResolver } from './resolvers/LuzumMuzekkeresiResolver'
import { LuzumMuzekkeresiRenderer } from './renderers/LuzumMuzekkeresiRenderer'
import { IhtiyacListesiResolver } from './resolvers/IhtiyacListesiResolver'
import { IhtiyacListesiRenderer } from './renderers/IhtiyacListesiRenderer'
import { DefaultDocumentResolver } from './resolvers/DefaultDocumentResolver'
import { DefaultDocumentRenderer } from './renderers/DefaultDocumentRenderer'

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
 */
export class TemplateRegistry {
  private static definitions = new Map<string, DocumentDefinition<any>>()
  private static isInitialized = false

  /**
   * Varsayılan şablonları kayıt defterine yükler (Lazy initialization)
   */
  static init(): void {
    if (this.isInitialized) return

    // 1. Pilot Belge: Lüzum Müzekkeresi (Tam İzolasyon)
    this.registerInternal({
      templateKey: 'luzum_muzekkeresi',
      name: 'LuzumMuzekkeresi',
      title: 'Standart Form: Lüzum Müzekkeresi',
      category: '1-ihtiyac-tespiti-ve-baslangic',
      categoryLabel: 'Hazırlık & İhtiyaç',
      description: 'Harcama yetkilisinden alım onayının talep edildiği resmî başlangıç müzekkeresi',
      orientation: 'portrait',
      resolver: new LuzumMuzekkeresiResolver(),
      renderer: LuzumMuzekkeresiRenderer,
      requiredProviders: ['institutionalHeader', 'items']
    })

    // 2. Çekirdek Belge: İhtiyaç Listesi (Tam İzolasyon)
    this.registerInternal({
      templateKey: 'ihtiyac_listesi',
      name: 'IhtiyacListesi',
      title: 'Standart Form: İhtiyaç Listesi Cetveli',
      category: '1-ihtiyac-tespiti-ve-baslangic',
      categoryLabel: 'Hazırlık & İhtiyaç',
      description: 'Alımı yapılacak mal/hizmet kalemlerinin detaylı ihtiyaç tablosu',
      orientation: 'portrait',
      resolver: new IhtiyacListesiResolver(),
      renderer: IhtiyacListesiRenderer,
      requiredProviders: ['institutionalHeader', 'items']
    })

    // 3. Diğer Şablonlar (Kademeli Geçiş Adaptörü)
    if (baseTemplateRegistry) {
      const baseKeys = Object.keys(baseTemplateRegistry) as TemplateKey[]
      for (const key of baseKeys) {
        const canonicalKey = (resolveTemplateKey(key) as string) || key
        if (!this.definitions.has(canonicalKey)) {
          const baseDef = (baseTemplateRegistry as any)[key]
          if (baseDef) {
            const defaultResolver = new DefaultDocumentResolver()
            const defaultRenderer = (props: any) =>
              React.createElement(DefaultDocumentRenderer, { ...props, templateKey: key })

            this.registerInternal({
              templateKey: key,
              name: baseDef.name || key,
              title: baseDef.title || key,
              category: baseDef.category || 'diger',
              categoryLabel: baseDef.categoryLabel || 'Diğer',
              description: baseDef.description || '',
              orientation: baseDef.orientation || 'portrait',
              resolver: defaultResolver,
              renderer: defaultRenderer
            })
          }
        }
      }
    }

    this.isInitialized = true
  }

  private static registerInternal<TData>(def: DocumentDefinition<TData>): void {
    const canonicalKey = (resolveTemplateKey(def.templateKey) as string) || def.templateKey
    this.definitions.set(canonicalKey, def)
    this.definitions.set(def.templateKey, def)
    this.definitions.set(def.templateKey.replace(/_/g, '-'), def)
    this.definitions.set(def.templateKey.replace(/-/g, '_'), def)
  }

  /**
   * Yeni bir belge tanımı kaydeder
   */
  static register<TData>(def: DocumentDefinition<TData>): void {
    this.init()
    this.registerInternal(def)
  }

  /**
   * Şablon anahtarına göre belge tanımını getirir.
   * Bilinmeyen anahtarlarda açık InvalidTemplateKeyError fırlatır.
   */
  static get<TData = any>(templateKey: string): DocumentDefinition<TData> {
    this.init()
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
    this.init()
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
    this.init()
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
    this.isInitialized = false
    this.definitions.clear()
  }
}
