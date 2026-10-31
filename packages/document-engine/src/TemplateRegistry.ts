import React from 'react'
import {
  TemplateKey,
  resolveTemplateKey,
  templateRegistry as baseTemplateRegistry,
  DocumentPage
} from '@temin360/document-templates'
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
  private static isInitialized = false

  /**
   * Varsayılan şablonları kayıt defterine yükler (Lazy initialization)
   */
  static init(): void {
    if (this.isInitialized) return

    if (baseTemplateRegistry) {
      const baseKeys = Object.keys(baseTemplateRegistry) as TemplateKey[]
      for (const key of baseKeys) {
        const canonicalKey = (resolveTemplateKey(key) as string) || key
        if (!this.definitions.has(canonicalKey)) {
          const baseDef = baseTemplateRegistry[key]
          if (baseDef) {
            this.registerInternal({
              templateKey: key,
              name: baseDef.name,
              title: baseDef.title,
              category: baseDef.category,
              categoryLabel: baseDef.categoryLabel,
              description: baseDef.description,
              orientation: baseDef.orientation,
              resolver: {
                resolve: async (ctx) => ({ ...ctx.headerData })
              },
              renderer: (props: any) =>
                React.createElement(DocumentPage, {
                  templateKey: key,
                  data: props.data,
                  orientation: props.orientation || baseDef.orientation,
                  className: props.className,
                  style: props.style
                })
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
