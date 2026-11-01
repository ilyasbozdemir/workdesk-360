import { DocumentDataResolver, DocumentResolutionContext } from '../types/contracts'
import { TemplateResolver } from '@temin360/document-templates'

export type ProcessMappingProvider = (processPath: string) => any

/**
 * Geçiş Dönemi Genel Belge Çözücüsü (DefaultDocumentResolver)
 * - Henüz özel resolver yazılmamış şablonlar için temel eşleme ve üst veri sağlar.
 * - TemplateResolver üzerinden veri derler.
 */
export class DefaultDocumentResolver implements DocumentDataResolver<Record<string, unknown>> {
  private static mappingProvider: ProcessMappingProvider | null = null

  static setMappingProvider(provider: ProcessMappingProvider | null): void {
    this.mappingProvider = provider
  }

  async resolve(context: DocumentResolutionContext): Promise<Record<string, unknown>> {
    const { dosyaId, templateKey, headerData, queryExecutor } = context

    const mapping = DefaultDocumentResolver.mappingProvider
      ? DefaultDocumentResolver.mappingProvider(templateKey)
      : { mappings: [] }

    const resolver = new TemplateResolver(queryExecutor)
    let baseData: Record<string, unknown> = {}

    try {
      baseData = await resolver.resolve(mapping, dosyaId || 0, templateKey)
    } catch (e) {
      console.warn(`[DefaultDocumentResolver] mapping resolver error for "${templateKey}":`, e)
    }

    return {
      ...baseData,
      antetSatirlari: headerData.antetSatirlari,
      kurumUst: headerData.kurumUst,
      kurumAdi: headerData.kurumAdi,
      mudurluk: headerData.mudurluk,
      solLogo: headerData.solLogo,
      sagLogo: headerData.sagLogo,
      evrakSayisi: headerData.evrakSayisi || (baseData.evrakSayisi as string) || '',
      sunulacakMakamAdi:
        baseData.sunulacakMakamAdi ||
        headerData.sunulacakMakam ||
        (headerData.harcamaYetkilisiUnvan
          ? `${headerData.harcamaYetkilisiUnvan.toUpperCase()}`
          : 'HARCAMA YETKİLİSİ MAKAMINA'),
      onaylayanPersonelAdi: headerData.harcamaYetkilisiAdi || '',
      onaylayanPersonelUnvan: headerData.harcamaYetkilisiUnvan || 'Harcama Yetkilisi'
    }
  }
}
