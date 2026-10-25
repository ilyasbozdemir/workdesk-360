import {
  DocumentResolver,
  DocumentSource,
  DocumentResolveContext,
  DocumentResolveResult
} from './types'
import { TEMPLATE_OPTIONS, TemplateOptionItem } from '../templateResolver'
import { DocumentEngine } from './DocumentEngine'

/**
 * Dosya Belge Çözücüsü (dosyaResolver)
 * - Belge çözümleme sorumluluğunu doğrudan TemplateRegistry ve DocumentEngine'e devreder.
 * - Monolitik get-document-payload mekanizmasına bağımlılığı ortadan kaldırır.
 */
export const dosyaResolver: DocumentResolver = {
  async templates(_source: DocumentSource): Promise<TemplateOptionItem[]> {
    void _source
    return TEMPLATE_OPTIONS
  },

  async resolve(
    source: DocumentSource,
    templateId: string,
    context?: DocumentResolveContext
  ): Promise<DocumentResolveResult> {
    if (source.kind !== 'dosya') {
      throw new Error(
        `dosyaResolver yalnızca "dosya" kaynaklarını destekler. Alınan: ${source.kind}`
      )
    }

    const docRecord = await DocumentEngine.loadOrCreateDocument({
      dosyaId: source.dosyaId,
      templateKey: templateId,
      context
    })

    const dataObj = (docRecord.data || {}) as Record<string, unknown>

    return {
      resolvedData: dataObj,
      formData: dataObj,
      personelListesi: docRecord.personelListesi,
      birimListesi: docRecord.birimListesi,
      firmaListesi: docRecord.firmaListesi,
      dosyaRecord: docRecord.dosyaRecord,
      activeLogoLeft: docRecord.headerData?.solLogo ? true : false,
      activeLogoRight: docRecord.headerData?.sagLogo ? true : false,
      activeOrientation: 'portrait',
      initialSnapshotJson: JSON.stringify(dataObj)
    }
  }
}
