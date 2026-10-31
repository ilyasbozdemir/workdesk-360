<<<<<<< HEAD
import React from 'react'
import {
  TemplateKey,
  templateRegistry as baseTemplateRegistry
} from '@temin360/document-templates'
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
import { DocumentDefinition } from './types/contracts'
import { LuzumMuzekkeresiResolver } from './resolvers/LuzumMuzekkeresiResolver'
import { LuzumMuzekkeresiRenderer } from './renderers/LuzumMuzekkeresiRenderer'
import { IhtiyacListesiResolver } from './resolvers/IhtiyacListesiResolver'
import { IhtiyacListesiRenderer } from './renderers/IhtiyacListesiRenderer'
import { DefaultDocumentResolver } from './resolvers/DefaultDocumentResolver'
import { DefaultDocumentRenderer } from './renderers/DefaultDocumentRenderer'
========
import {
  TemplateRegistry as CoreTemplateRegistry,
  InvalidTemplateKeyError,
  DocumentDefinition
} from '@worksuite-360/document-engine'
import { LuzumMuzekkeresiResolver } from '../resolvers/LuzumMuzekkeresiResolver'
import { LuzumMuzekkeresiRenderer } from '../renderers/LuzumMuzekkeresiRenderer'
import { IhtiyacListesiResolver } from '../resolvers/IhtiyacListesiResolver'
import { IhtiyacListesiRenderer } from '../renderers/IhtiyacListesiRenderer'
import { DefaultDocumentResolver } from '../resolvers/DefaultDocumentResolver'
import { DefaultDocumentRenderer } from '../renderers/DefaultDocumentRenderer'
import React from 'react'
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts

export { InvalidTemplateKeyError }

/**
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
=======
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
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
 * Bağımsız Belge Şablon Kayıt Defteri (TemplateRegistry)
 * - Her şablonun kendine ait resolver, renderer ve metadata kaydını tutar.
 * - Bilinmeyen anahtarlar için açık hata fırlatır; sessiz yönlendirme yapmaz.
 * - UI veya masaüstü bağımlılığı içermez; saf TypeScript mimarisindedir.
<<<<<<< HEAD
========
 * TEMİN 360 Belge Şablon Kayıt Defteri Adaptörü
 * - Çekirdek @worksuite-360/document-engine TemplateRegistry'sini kullanır.
 * - TEMİN 360'a özel Lüzum Müzekkeresi, İhtiyaç Listesi ve diğer şablonları çekirdek deftere kaydeder.
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
 */
export class TemplateRegistry {
  private static isInitialized = false

  /**
   * Varsayılan şablonları kayıt defterine yükler (Lazy initialization)
   */
  static init(): void {
    if (this.isInitialized) return

    // 1. Pilot Belge: Lüzum Müzekkeresi (Tam İzolasyon)
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
    this.registerInternal({
========
    CoreTemplateRegistry.register({
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
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
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
    this.registerInternal({
========
    CoreTemplateRegistry.register({
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
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

<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
    // 3. Diğer Şablonlar (Kademeli Geçiş Adaptörü)
    if (baseTemplateRegistry) {
      const baseKeys = Object.keys(baseTemplateRegistry) as TemplateKey[]
      for (const key of baseKeys) {
        if (!this.definitions.has(key)) {
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
========
    // 3. Diğer 28 Şablon (Kademeli Geçiş Adaptörü)
    const baseKeys = Object.keys(baseTemplateRegistry) as TemplateKey[]
    for (const key of baseKeys) {
      if (!CoreTemplateRegistry.has(key)) {
        const baseDef = baseTemplateRegistry[key]
        if (baseDef) {
          const defaultResolver = new DefaultDocumentResolver()
          const defaultRenderer = (props: any) =>
            React.createElement(DefaultDocumentRenderer, { ...props, templateKey: key })

          CoreTemplateRegistry.register({
            templateKey: key,
            name: baseDef.name,
            title: baseDef.title,
            category: baseDef.category,
            categoryLabel: baseDef.categoryLabel,
            description: baseDef.description,
            orientation: baseDef.orientation,
            resolver: defaultResolver,
            renderer: defaultRenderer
          })
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
        }
      }
    }

    this.isInitialized = true
  }

<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
  private static registerInternal<TData>(def: DocumentDefinition<TData>): void {
=======
 */
export class TemplateRegistry {
  private static definitions = new Map<string, DocumentDefinition<any>>()

  /**
   * Yeni bir belge tanımı kaydeder
   */
  static register<TData>(def: DocumentDefinition<TData>): void {
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
    const canonicalKey = (resolveTemplateKey(def.templateKey) as string) || def.templateKey
    this.definitions.set(canonicalKey, def)
    this.definitions.set(def.templateKey, def)
    this.definitions.set(def.templateKey.replace(/_/g, '-'), def)
    this.definitions.set(def.templateKey.replace(/-/g, '_'), def)
  }

  /**
<<<<<<< HEAD
   * Yeni bir belge tanımı kaydeder
   */
  static register<TData>(def: DocumentDefinition<TData>): void {
    this.init()
    this.registerInternal(def)
========
  static register<TData>(def: DocumentDefinition<TData>): void {
    this.init()
    CoreTemplateRegistry.register(def)
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
  }

  static get<TData = any>(templateKey: string): DocumentDefinition<TData> {
    this.init()
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
=======
   * Şablon anahtarına göre belge tanımını getirir.
   * Bilinmeyen anahtarlarda açık InvalidTemplateKeyError fırlatır.
   */
  static get<TData = any>(templateKey: string): DocumentDefinition<TData> {
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
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
<<<<<<< HEAD
========
    return CoreTemplateRegistry.get<TData>(templateKey)
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
  }

  static has(templateKey: string): boolean {
    this.init()
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
=======
  }

  /**
   * Şablonun kayıtlı olup olmadığını kontrol eder
   */
  static has(templateKey: string): boolean {
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
    if (!templateKey) return false
    const cleanKey = templateKey.replace(/\.html$/i, '').trim()
    const canonical = (resolveTemplateKey(cleanKey) as string) || cleanKey
    return (
      this.definitions.has(canonical) ||
      this.definitions.has(cleanKey) ||
      this.definitions.has(cleanKey.replace(/-/g, '_')) ||
      this.definitions.has(cleanKey.replace(/_/g, '-'))
    )
<<<<<<< HEAD
========
    return CoreTemplateRegistry.has(templateKey)
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
  }

  static getAll(): DocumentDefinition[] {
    this.init()
<<<<<<<< HEAD:packages/document-engine/src/TemplateRegistry.ts
=======
  }

  /**
   * Tüm kayıtlı belge tanımlarını döner
   */
  static getAll(): DocumentDefinition[] {
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
    const unique = new Map<TemplateKey | string, DocumentDefinition>()
    this.definitions.forEach((def) => {
      unique.set(def.templateKey, def)
    })
    return Array.from(unique.values())
<<<<<<< HEAD
========
    return CoreTemplateRegistry.getAll()
  }

  static clear(): void {
    this.isInitialized = false
    CoreTemplateRegistry.clear()
>>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/registry/TemplateRegistry.ts
=======
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
  }

  /**
   * Testler ve sıfırlama için defteri temizler
   */
  static clear(): void {
<<<<<<< HEAD
    this.isInitialized = false
    this.definitions.clear()
  }
}
=======
    this.definitions.clear()
  }
}

>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c
