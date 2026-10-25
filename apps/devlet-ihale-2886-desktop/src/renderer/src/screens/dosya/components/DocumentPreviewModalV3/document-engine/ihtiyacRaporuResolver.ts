import { DocumentResolver, DocumentSource } from './types'
import { TemplateOptionItem } from '../templateResolver'
import { ihtiyacRaporuService } from '../../../../../services/ihtiyacRaporuService'
import { mapRaporToLuzumMuzekkeresiData } from '../../../../../services/ihtiyacRaporuAdapter'
import { kurumService } from '../../../../../services/kurumService'

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

    // Personel listesi için rapordaki talep eden personeli ekle
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
