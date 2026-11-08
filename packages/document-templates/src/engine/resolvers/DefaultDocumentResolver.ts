import { DocumentDataResolver, DocumentResolutionContext } from '@worksuite-360/document-engine'
import { TemplateResolver } from '../../resolver/TemplateResolver'

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

    const effectiveTarih = (baseData.dosyaTarihi as string) || (baseData.tarih as string) || headerData.dosyaTarihi || new Date().toISOString().split('T')[0]
    const effectiveKonu = (baseData.dosyaKonusu as string) || (baseData.konu as string) || (baseData.isinAdi as string) || headerData.konu || ''

    return {
      ...baseData,
      dosyaId: dosyaId || 0,
      dosyaNo: (baseData.dosyaNo as string) || (baseData.teminNo as string) || headerData.dosyaNo || '',
      dosyaKonusu: effectiveKonu,
      konu: effectiveKonu,
      dosyaTarihi: effectiveTarih,
      tarih: effectiveTarih,
      antetSatirlari: headerData.antetSatirlari,
      kurumUst: headerData.kurumUst,
      kurumAdi: headerData.kurumAdi,
      mudurluk: headerData.mudurluk,
      ihtiyacYeri: (baseData.ihtiyacYeri as string) || headerData.mudurluk || '',
      solLogo: headerData.solLogo,
      sagLogo: headerData.sagLogo,
      evrakSayisi: headerData.evrakSayisi || (baseData.evrakSayisi as string) || '',
      sunulacakMakamAdi:
        baseData.sunulacakMakamAdi ||
        headerData.sunulacakMakam ||
        (headerData.harcamaYetkilisiUnvan
          ? `${headerData.harcamaYetkilisiUnvan.toUpperCase()}`
          : 'HARCAMA YETKİLİSİ MAKAMINA'),
      hazirlayanPersonelAdi: (baseData.hazirlayanPersonelAdi as string) || headerData.hazirlayanPersonelAdi || '',
      hazirlayanPersonelUnvan: (baseData.hazirlayanPersonelUnvan as string) || headerData.hazirlayanPersonelUnvan || '',
      onaylayanPersonelAdi: (baseData.onaylayanPersonelAdi as string) || headerData.harcamaYetkilisiAdi || '',
      onaylayanPersonelUnvan: (baseData.onaylayanPersonelUnvan as string) || headerData.harcamaYetkilisiUnvan || 'Harcama Yetkilisi',
      onayTarihi: (baseData.onayTarihi as string) || effectiveTarih,
      onayaSunulanTarih: (baseData.onayaSunulanTarih as string) || effectiveTarih
    }
  }
}

