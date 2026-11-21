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
  const [personel, birim, firma, komisyonRows] = await Promise.all([
    queryRows(
      "SELECT id, ad_soyad, unvan, telefon, eposta, birim, birim_id, sicil_no FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1 OR aktif_mi = '1' OR aktif_mi = 'true' ORDER BY ad_soyad ASC"
    ),
    queryRows(
      'SELECT id, ad, birim_adi, kisa_ad, sunum_makami, antet_ek_satir, harcama_yetkilisi_id, harcama_yetkilisi_unvan FROM TANIM_Birim WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY birim_adi ASC'
    ),
    queryRows(
      'SELECT f.id, f.unvan, f.vergi_no, f.adres, f.telefon, f.email FROM DATA_TeminFirma tf JOIN TANIM_Firma f ON tf.firma_id = f.id WHERE tf.temin_dosya_id = ? ORDER BY tf.id ASC',
      [dosyaId]
    ),
    queryRows(
      `SELECT tk.*, 
              COALESCE(NULLIF(tk.ad_soyad, ''), NULLIF(p.ad_soyad, ''), '') as resolved_ad_soyad,
              COALESCE(NULLIF(tk.unvan, ''), NULLIF(p.unvan, ''), '') as resolved_unvan,
              COALESCE(NULLIF(tk.birim, ''), NULLIF(p.birim, ''), '') as resolved_birim
       FROM DATA_TeminKomisyon tk
       LEFT JOIN TANIM_Personel p ON (
         (tk.personel_id IS NOT NULL AND tk.personel_id > 0 AND tk.personel_id = p.id)
         OR
         ((tk.personel_id IS NULL OR tk.personel_id = 0) AND LOWER(TRIM(tk.ad_soyad)) = LOWER(TRIM(p.ad_soyad)))
       )
       WHERE tk.temin_dosya_id = ? AND (tk.belgede_goster = 1 OR tk.belgede_goster IS NULL)
       ORDER BY tk.id ASC`,
      [dosyaId]
    )
  ])
  const firmaFinal = firma.length
    ? firma
    : await queryRows(
        'SELECT id, unvan, vergi_no, adres, telefon, email FROM TANIM_Firma ORDER BY unvan ASC LIMIT 200'
      )
  return { personel, birim, firma: firmaFinal, komisyon: komisyonRows }
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

    const headerObj = (docRecord.headerData || {}) as Record<string, unknown>
    const dataObj = {
      ...headerObj,
      ...((docRecord.data || {}) as Record<string, unknown>)
    }
    const currentMakam = String(dataObj.sunulacakMakamAdi || dataObj.sunulacakMakam || '').trim()
    const headerMakam = String(docRecord.headerData?.sunulacakMakam || '').trim()
    const kAdi = String(headerObj.kurumAdi || '').trim()
    const sKurum = String(headerObj.sunulacakKurumAdi || '').trim()
    const isBare = !currentMakam ||
      (kAdi && currentMakam.toLowerCase() === kAdi.toLowerCase()) ||
      (sKurum && currentMakam.toLowerCase() === sKurum.toLowerCase()) ||
      !currentMakam.toUpperCase().includes('MAKAM')
    if (headerMakam && isBare) {
      dataObj.sunulacakMakamAdi = headerMakam
      dataObj.sunulacakMakam = headerMakam
    }
    const lists = await loadDosyaLists(source.dosyaId)
    const pick = (a: unknown[] | undefined, b: unknown[]) => (a && a.length > 0 ? a : b)

    // Canlı Komisyon Senkronizasyonu:
    // DATA_TeminKomisyon tablosundaki güncel personelleri canlı veri olarak hazırla
    if (Array.isArray(lists.komisyon) && lists.komisyon.length > 0) {
      const isMuayene =
        templateId.toLowerCase().includes('muayene') || templateId.toLowerCase().includes('kabul')
      const targetOfficers = lists.komisyon
        .filter((k: any) => {
          const gorev = String(k.gorev || '').toLowerCase()
          const tur = String(k.komisyon_turu || '').toLowerCase()
          if (isMuayene) {
            const isMuayeneTur = tur.includes('muayene') || tur.includes('kabul')
            const isMuayeneId = Number(k.komisyon_id) === 2
            if (!isMuayeneTur && !isMuayeneId && lists.komisyon.some((m: any) => String(m.komisyon_turu || '').toLowerCase().includes('muayene') || Number(m.komisyon_id) === 2)) {
              return false
            }
          }
          
          const isHarcamaYetkilisiOrGerceklestirme =
            gorev.includes('harcama yetkili') ||
            gorev.includes('gerçekleştirme') ||
            gorev.includes('gerceklestirme') ||
            gorev.includes('muhasebe')
          if (isHarcamaYetkilisiOrGerceklestirme) return false

          // Onaylayan veya Hazırlayan personel listeye dahil edilmez (Rol İzolasyonu)
          const adSoyad = String(k.resolved_ad_soyad || k.ad_soyad || '').trim().toLowerCase()
          const onaylayan = String(dataObj.onaylayanPersonelAdi || dataObj.harcamaYetkilisiAdi || '').trim().toLowerCase()
          const hazirlayan = String(dataObj.hazirlayanPersonelAdi || '').trim().toLowerCase()
          if (onaylayan && adSoyad === onaylayan) return false
          if (hazirlayan && adSoyad === hazirlayan) return false

          return true
        })
        .map((k: any) => ({
          adSoyad: k.resolved_ad_soyad || k.ad_soyad || '',
          unvan: k.resolved_unvan || k.unvan || '',
          gorevi: k.gorev || (isMuayene ? 'Üye' : 'Fiyat Araştırma Görevlisi'),
          imzaTuru: k.imza_turu || 'İmza',
          asilMi: k.asli_yedek === 'Yedek' ? 0 : 1,
          birimId: k.birim_id,
          birim: k.resolved_birim || k.birim
        }))

      if (targetOfficers.length > 0) {
        ;(dataObj as any)._liveCommissionOfficers = targetOfficers
        if (isMuayene) {
          ;(dataObj as any).muayeneKomisyonu = targetOfficers
          ;(dataObj as any).gorevlendirilenler = targetOfficers
          ;(dataObj as any).dagitimListesi = targetOfficers
        } else {
          ;(dataObj as any).fiyatKomisyonu = targetOfficers
          ;(dataObj as any).gorevlendirilenler = targetOfficers
          ;(dataObj as any).dagitimListesi = targetOfficers
        }
      }
    }

    return {
      resolvedData: dataObj,
      formData: dataObj,
      personelListesi: pick(docRecord.personelListesi, lists.personel),
      birimListesi: pick(docRecord.birimListesi, lists.birim),
      firmaListesi: pick(docRecord.firmaListesi, lists.firma),
      dosyaRecord: docRecord.dosyaRecord,
      activeLogoLeft:
        dataObj.showLogoLeft !== undefined
          ? Boolean(dataObj.showLogoLeft)
          : docRecord.headerData?.solLogo
            ? true
            : false,
      activeLogoRight:
        dataObj.showLogoRight !== undefined
          ? Boolean(dataObj.showLogoRight)
          : docRecord.headerData?.sagLogo
            ? true
            : false,
      activeOrientation:
        dataObj.orientation === 'landscape' ? 'landscape' : 'portrait',
      initialSnapshotJson: JSON.stringify(dataObj)
    }
  }
}

export const ihtiyacRaporuResolver: DocumentResolver = {
  async templates(_source: DocumentSource): Promise<TemplateOptionItem[]> {
    void _source
    return IHTIYAC_RAPORU_TEMPLATES
  },

  async resolve(source: DocumentSource, templateId: string, context?: DocumentResolveContext) {
    if (source.kind !== 'ihtiyacRaporu') {
      throw new Error(
        `ihtiyacRaporuResolver yalnızca "ihtiyacRaporu" kaynaklarını destekler. Alınan: ${source.kind}`
      )
    }

    const [rapor, kalemler, kurumInfo, personelRows, birimRows] = await Promise.all([
      ihtiyacRaporuService.getRaporById(source.raporId),
      ihtiyacRaporuService.getRaporKalemleri(source.raporId),
      kurumService.getKurumInfo(),
      queryRows(
        "SELECT id, ad_soyad, unvan, telefon, eposta, birim, birim_id, sicil_no FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1 OR aktif_mi = '1' OR aktif_mi = 'true' ORDER BY ad_soyad ASC"
      ),
      queryRows(
        'SELECT id, ad, birim_adi, kisa_ad, sunum_makami, antet_ek_satir, harcama_yetkilisi_id, harcama_yetkilisi_unvan FROM TANIM_Birim WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY birim_adi ASC'
      )
    ])

    if (!rapor) {
      throw new Error(`İhtiyaç raporu bulunamadı (ID: ${source.raporId})`)
    }

    const baseDocData = mapRaporToLuzumMuzekkeresiData(
      rapor,
      kalemler || [],
      kurumInfo
        ? {
            kurum_anteti: kurumInfo.kurum_anteti,
            makam_adi: kurumInfo.makam_adi
          }
        : undefined
    )

    let savedSnapshotOverlay: Record<string, any> | null = null
    if (!context?.forceDefault) {
      if (rapor.belge_snapshot_json) {
        try {
          const parsed = JSON.parse(rapor.belge_snapshot_json)
          if (parsed && typeof parsed === 'object') {
            savedSnapshotOverlay =
              parsed[templateId] ||
              parsed.luzum_muzekkeresi ||
              parsed.ihtiyac_listesi ||
              null
          }
        } catch {
          savedSnapshotOverlay = null
        }
      }

      if (!savedSnapshotOverlay && rapor.temin_dosya_id && Number(rapor.temin_dosya_id) > 0) {
        try {
          const adapter = DocumentEngine.getStorageAdapter()
          if (adapter) {
            const snap = await adapter.getDocument({
              dosyaId: Number(rapor.temin_dosya_id),
              templateKey: templateId
            })
            if (snap?.record?.data && typeof snap.record.data === 'object') {
              savedSnapshotOverlay = snap.record.data as Record<string, any>
            }
          }
        } catch {
          // ignore adapter error
        }
      }
    }

    const docData: Record<string, any> = savedSnapshotOverlay
      ? { ...baseDocData, ...savedSnapshotOverlay }
      : { ...baseDocData }

    const fallbackPersonel = rapor.talep_eden_personel
      ? [
          {
            id: rapor.talep_eden_personel_id || 1,
            ad_soyad: rapor.talep_eden_personel,
            unvan: rapor.talep_eden_unvan || 'Talep Eden Personel'
          }
        ]
      : []

    const fallbackBirim = rapor.birim_adi
      ? [
          {
            id: rapor.birim_id || 1,
            birim_adi: rapor.birim_adi
          }
        ]
      : []

    const personelListesi = personelRows.length > 0 ? personelRows : fallbackPersonel
    const birimListesi = birimRows.length > 0 ? birimRows : fallbackBirim

    return {
      resolvedData: docData,
      formData: docData,
      personelListesi,
      birimListesi,
      firmaListesi: [],
      raporRecord: rapor,
      activeLogoLeft:
        docData.showLogoLeft !== undefined ? Boolean(docData.showLogoLeft) : true,
      activeLogoRight:
        docData.showLogoRight !== undefined ? Boolean(docData.showLogoRight) : false,
      activeOrientation:
        docData.orientation === 'landscape' ? 'landscape' : 'portrait',
      initialSnapshotJson: JSON.stringify(docData)
    }
  }
}

export const sourceResolvers: Record<DocumentSource['kind'], DocumentResolver> = {
  dosya: dosyaResolver,
  ihtiyacRaporu: ihtiyacRaporuResolver
}

