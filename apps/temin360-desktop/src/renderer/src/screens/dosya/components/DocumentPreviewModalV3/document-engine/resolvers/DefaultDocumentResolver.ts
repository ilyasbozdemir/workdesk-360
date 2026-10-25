import { DocumentDataResolver, DocumentResolutionContext } from '../registry/types'
import { TemplateResolver } from '@temin360/document-templates'
import { getDefaultMappingForProcess } from '../../../../../../constants/mappings'

/**
 * Geçiş Dönemi Genel Belge Çözücüsü (DefaultDocumentResolver)
 * - Henüz özel resolver yazılmamış şablonlar için temel eşleme ve üst veri sağlar.
 * - Monolitik dev resolver'a bağımlı kalmadan TemplateResolver ve InstitutionalHeaderProvider üzerinden veri derler.
 */
export class DefaultDocumentResolver implements DocumentDataResolver<Record<string, unknown>> {
  async resolve(context: DocumentResolutionContext): Promise<Record<string, unknown>> {
    const { dosyaId, templateKey, headerData, queryExecutor } = context

    const mapping = getDefaultMappingForProcess(templateKey)
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
