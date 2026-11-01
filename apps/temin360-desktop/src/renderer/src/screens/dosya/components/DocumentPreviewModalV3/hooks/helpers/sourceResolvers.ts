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


async function queryRows(sql: string, params: unknown[] = []): Promise<any[]> {
  try {
    if (!window.electron?.ipcRenderer) return []
    const res = await window.electron.ipcRenderer.invoke('db:query', sql, params)
    return res && res.success && Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.warn('[sourceResolvers] liste sorgusu hatası:', err)
    return []
  }
}

async function loadDosyaLists(dosyaId: number) {
  const [personel, birim, firma] = await Promise.all([
    queryRows(
      "SELECT id, ad_soyad, unvan, telefon, eposta, birim, sicil_no FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1 OR aktif_mi = '1' OR aktif_mi = 'true' ORDER BY ad_soyad ASC"
    ),
    queryRows(
      'SELECT id, ad, birim_adi, kisa_ad, sunum_makami, antet_ek_satir, harcama_yetkilisi_id, harcama_yetkilisi_unvan FROM TANIM_Birim WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY birim_adi ASC'
    ),
    queryRows(
      'SELECT f.id, f.unvan, f.vergi_no, f.adres, f.telefon, f.email FROM DATA_TeminFirma tf JOIN TANIM_Firma f ON tf.firma_id = f.id WHERE tf.temin_dosya_id = ? ORDER BY tf.id ASC',
      [dosyaId]
    )
  ])
  const firmaFinal = firma.length
    ? firma
    : await queryRows(
        'SELECT id, unvan, vergi_no, adres, telefon, email FROM TANIM_Firma ORDER BY unvan ASC LIMIT 200'
      )
  return { personel, birim, firma: firmaFinal }
}

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
    const lists = await loadDosyaLists(source.dosyaId)
    const pick = (a: unknown[] | undefined, b: unknown[]) => (a && a.length > 0 ? a : b)

    return {
      resolvedData: dataObj,
      formData: dataObj,
      personelListesi: pick(docRecord.personelListesi, lists.personel),
      birimListesi: pick(docRecord.birimListesi, lists.birim),
      firmaListesi: pick(docRecord.firmaListesi, lists.firma),
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

