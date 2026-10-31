import {
  TemplateKey,
  templateRegistry as baseTemplateRegistry
} from '@temin360/document-templates'
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

export { InvalidTemplateKeyError }

/**
 * TEMİN 360 Belge Şablon Kayıt Defteri Adaptörü
 * - Çekirdek @worksuite-360/document-engine TemplateRegistry'sini kullanır.
 * - TEMİN 360'a özel Lüzum Müzekkeresi, İhtiyaç Listesi ve diğer şablonları çekirdek deftere kaydeder.
 */
export class TemplateRegistry {
  private static isInitialized = false

  /**
   * Başlangıç tanımlarını kaydeder
   */
  static init(): void {
    if (this.isInitialized) return

    // 1. Pilot Belge: Lüzum Müzekkeresi (Tam İzolasyon)
    CoreTemplateRegistry.register({
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
    CoreTemplateRegistry.register({
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
        }
      }
    }

    this.isInitialized = true
  }

  static register<TData>(def: DocumentDefinition<TData>): void {
    this.init()
    CoreTemplateRegistry.register(def)
  }

  static get<TData = any>(templateKey: string): DocumentDefinition<TData> {
    this.init()
    return CoreTemplateRegistry.get<TData>(templateKey)
  }

  static has(templateKey: string): boolean {
    this.init()
    return CoreTemplateRegistry.has(templateKey)
  }

  static getAll(): DocumentDefinition[] {
    this.init()
    return CoreTemplateRegistry.getAll()
  }

  static clear(): void {
    this.isInitialized = false
    CoreTemplateRegistry.clear()
  }
}
