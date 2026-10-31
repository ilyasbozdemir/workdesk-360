import { DocumentEngine } from '@worksuite-360/document-engine'
import {
  DocumentResolver,
  DocumentSource,
  DocumentResolveContext,
  DocumentResolveResult
} from '../../types'
import { TEMPLATE_OPTIONS, TemplateOptionItem } from '../../templateResolver'
import { ihtiyacRaporuService } from '../../../../../../services/ihtiyacRaporuService'
import { mapRaporToLuzumMuzekkeresiData } from '../../../../../../services/ihtiyacRaporuAdapter'
import { kurumService } from '../../../../../../services/kurumService'

export const IHTIYAC_RAPORU_TEMPLATES: TemplateOptionItem[] = [
  {
    id: 'luzum_muzekkeresi',
    name: 'LuzumMuzekkeresi',
    title: 'Standart Form: Lüzum Müzekkeresi',
    category: 'ihtiyac-raporu',
    categoryLabel: 'İhtiyaç & Talep',
    description: 'İhtiyaç raporu gerekçesi ve kalemlerinden otomatik derlenen resmî onay belgesi'
  },
  {
    id: 'luzum_onay_eki',
    name: 'LuzumMuzekkeresiOnayEki',
    title: 'Lüzum Müzekkeresi Onay Eki (Çizelge)',
    category: 'ihtiyac-raporu',
    categoryLabel: 'İhtiyaç & Talep',
    description:
      'Lüzum Müzekkeresine eklenen ayrıntılı malzeme, hizmet ve yapım kalemleri çizelgesi'
  }
]

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

export const ihtiyacRaporuResolver: DocumentResolver = {
  async templates(_source: DocumentSource): Promise<TemplateOptionItem[]> {
    void _source
    return IHTIYAC_RAPORU_TEMPLATES
  },

  async resolve(source: DocumentSource, _templateId: string) {
    void _templateId
    if (source.kind !== 'ihtiyacRaporu') {
      throw new Error(
        `ihtiyacRaporuResolver yalnızca "ihtiyacRaporu" kaynaklarını destekler. Alınan: ${source.kind}`
      )
    }

    const [rapor, kalemler, kurumInfo] = await Promise.all([
      ihtiyacRaporuService.getRaporById(source.raporId),
      ihtiyacRaporuService.getRaporKalemleri(source.raporId),
      kurumService.getKurumInfo()
    ])

    if (!rapor) {
      throw new Error(`İhtiyaç raporu bulunamadı (ID: ${source.raporId})`)
    }

    const docData = mapRaporToLuzumMuzekkeresiData(
      rapor,
      kalemler || [],
      kurumInfo
        ? {
            kurum_anteti: kurumInfo.kurum_anteti,
            makam_adi: kurumInfo.makam_adi
          }
        : undefined
    )

    const personelListesi = rapor.talep_eden_personel
      ? [
          {
            id: rapor.talep_eden_personel_id || 1,
            ad_soyad: rapor.talep_eden_personel,
            unvan: rapor.talep_eden_unvan || 'Talep Eden Personel'
          }
        ]
      : []

    const birimListesi = rapor.birim_adi
      ? [
          {
            id: rapor.birim_id || 1,
            birim_adi: rapor.birim_adi
          }
        ]
      : []

    return {
      resolvedData: docData,
      formData: docData,
      personelListesi,
      birimListesi,
      firmaListesi: [],
      raporRecord: rapor,
      activeLogoLeft: true,
      activeLogoRight: false,
      activeOrientation: 'portrait',
      initialSnapshotJson: JSON.stringify(docData)
    }
  }
}

export const sourceResolvers: Record<DocumentSource['kind'], DocumentResolver> = {
  dosya: dosyaResolver,
  ihtiyacRaporu: ihtiyacRaporuResolver
}

