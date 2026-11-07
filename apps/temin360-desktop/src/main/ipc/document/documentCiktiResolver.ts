import Mustache from 'mustache'
import { resolveCommissionCategory } from '@temin360/document-templates'
import { readSystemTemplate } from './documentUtils'
import { resolveDocumentPayload } from './documentContextResolver'

/**
 * Çıktı Merkezi ve Toplu Belge Verisi Çözümleyicisi (documentCiktiResolver)
 * Belge ve dosya verilerini tek otorite olan resolveDocumentPayload üzerinden alır.
 * Mustache master şablonları ve sistem şablonlarıyla harmanlayarak Çıktı Merkezi'ne sunar.
 */
export function resolveAllCiktiData(
  db: any,
  payload: {
    dosyaId?: number
    sablonId?: number
    documentId?: string
    templateId?: string
  }
): { success: boolean; data?: any; error?: string } {
  try {
    if (!db || typeof db.prepare !== 'function') {
      return { success: false, error: 'Geçersiz veya kapalı veritabanı bağlantısı' }
    }

    const dosyaId = Number(payload?.dosyaId || 0)
    const targetSablonId =
      payload?.sablonId !== undefined && payload?.sablonId !== null && !isNaN(Number(payload.sablonId))
        ? Number(payload.sablonId)
        : undefined
    const targetDocId = payload?.documentId || payload?.templateId

    // 1. Master HTML & Master JSON
    const masterHtml =
      readSystemTemplate('master.html') ||
      '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>{{{content}}}</body></html>'
    let masterJson: any = {}
    const rawMasterJson = readSystemTemplate('master.html.json')
    if (rawMasterJson) {
      try {
        masterJson = JSON.parse(rawMasterJson)
      } catch {}
    }

    // 2. Templates (Açılan belge varsa sadece onu çek, yoksa aktif listeyi çek)
    let sablons: any[] = []
    if (targetSablonId) {
      sablons = db.prepare('SELECT * FROM TANIM_Sablon WHERE id = ?').all(targetSablonId)
      if (sablons.length === 0) {
        return {
          success: false,
          error: `Hedef şablon veritabanında bulunamadı (sablonId: ${targetSablonId})`
        }
      }
    } else if (targetDocId) {
      const cleanDoc = String(targetDocId).replace(/\.html$/i, '').trim().toLowerCase()
      sablons = db
        .prepare(
          `SELECT * FROM TANIM_Sablon 
           WHERE (kod = ? OR LOWER(dosya_adi) LIKE ? OR LOWER(route_path) LIKE ?) 
             AND aktif_mi = 1 
           ORDER BY id DESC LIMIT 1`
        )
        .all(targetDocId, `%${cleanDoc}%`, `%${cleanDoc}%`)
    } else {
      sablons = db
        .prepare(
          'SELECT * FROM TANIM_Sablon WHERE id IN (SELECT MAX(id) FROM TANIM_Sablon WHERE aktif_mi = 1 GROUP BY COALESCE(parent_id, id)) ORDER BY kategori ASC, ad ASC'
        )
        .all()
    }

    // 3. Placeholders (sadece ihtiyaç varsa)
    let placeholders: any[] = []
    if (!targetSablonId && !targetDocId) {
      try {
        placeholders = db.prepare('SELECT * FROM TANIM_Placeholder').all()
      } catch {}
    }

    // 4. Tek Otorite: resolveDocumentPayload üzerinden ana veri çözümleme
    const effectiveDocId =
      targetDocId || (sablons.length === 1 ? (sablons[0].kod || sablons[0].route_path || sablons[0].dosya_adi) : undefined)

    const payloadRes = resolveDocumentPayload(db, {
      dosyaId,
      documentId: effectiveDocId
    })

    if (!payloadRes?.success) {
      return {
        success: false,
        error: `Belge çözümleme hatası: ${payloadRes?.error || 'Bilinmeyen hata'}`
      }
    }

    const payloadData = payloadRes.data || {}
    const activeDosya = payloadData.dosya || null
    const settingsMap = payloadData.settings || {}
    const personelListesi = payloadData.personelListesi || []
    const fileFirms = payloadData.fileFirms || []
    const komisyonlar = payloadData.komisyonlar || []
    const resolvedContext = payloadData.resolvedContext || {}

    // 5. dosyaContext: Tek otoriteden gelen resolvedContext ile masterJson birleşimi
    const dosyaContext: any = {
      ...masterJson,
      ...resolvedContext,
      id: activeDosya?.id || resolvedContext.dosyaId || resolvedContext.id || 0,
      dosya_no: activeDosya?.temin_no || resolvedContext.teminNo || resolvedContext.dosya_no || '',
      isin_tanimi: activeDosya?.isin_aciklamasi || activeDosya?.konu || resolvedContext.isinTanimi || resolvedContext.isin_tanimi || '',
      butce_yili: activeDosya?.butce_yili || resolvedContext.butceYili || resolvedContext.butce_yili || new Date().getFullYear().toString(),
      firmalar: fileFirms,
      firmaListesi: fileFirms,
      harcamaYetkilisi: {
        adSoyad: activeDosya?.onaylayan_ad_soyad || resolvedContext.onaylayanPersonelAdi || resolvedContext.harcamaYetkilisi?.adSoyad || '',
        unvan: activeDosya?.onaylayan_unvan || resolvedContext.onaylayanPersonelUnvan || resolvedContext.harcamaYetkilisi?.unvan || 'Harcama Yetkilisi',
        telefon: activeDosya?.onaylayan_telefon || resolvedContext.harcamaYetkilisi?.telefon || ''
      },
      gerceklestirmeGorevlisi: {
        adSoyad: activeDosya?.hazirlayan_ad_soyad || resolvedContext.hazirlayanPersonelAdi || resolvedContext.gerceklestirmeGorevlisi?.adSoyad || '',
        unvan: activeDosya?.hazirlayan_unvan || resolvedContext.hazirlayanPersonelUnvan || resolvedContext.gerceklestirmeGorevlisi?.unvan || 'Gerçekleştirme Görevlisi',
        telefon: activeDosya?.hazirlayan_telefon || resolvedContext.gerceklestirmeGorevlisi?.telefon || ''
      },
      komisyon: komisyonlar.map((k: any) => ({
        adSoyad: k.resolved_ad_soyad || k.ad_soyad || '',
        unvan: k.resolved_unvan || k.unvan || '',
        gorevi: k.gorevi || k.gorev || 'Üye',
        komisyonTuru: k.komisyon_turu_adi || ''
      })),
      fiyatKomisyonu: resolvedContext.fiyatKomisyonu || komisyonlar
        .filter((k: any) => resolveCommissionCategory(k) === 'maliyet')
        .map((k: any) => ({
          adSoyad: k.resolved_ad_soyad || k.ad_soyad || '',
          unvan: k.resolved_unvan || k.unvan || '',
          gorevi: k.gorevi || k.gorev || 'Üye',
          komisyonTuru: k.komisyon_turu_adi || ''
        })),
      muayeneKomisyonu: resolvedContext.muayeneKomisyonu || komisyonlar
        .filter((k: any) => resolveCommissionCategory(k) === 'muayene')
        .map((k: any) => ({
          adSoyad: k.resolved_ad_soyad || k.ad_soyad || '',
          unvan: k.resolved_unvan || k.unvan || '',
          gorevi: k.gorevi || k.gorev || 'Üye',
          komisyonTuru: k.komisyon_turu_adi || ''
        }))
    }

    // 6. Hedeflenen şablonu render et (Mustache şablonları için)
    const renderedHtmlMap: Record<number, string> = {}
    const templateToRender = targetSablonId
      ? sablons.find((s: any) => s.id === targetSablonId)
      : (targetDocId && sablons.length === 1 ? sablons[0] : null)

    if (templateToRender) {
      let body = templateToRender.html_icerik || ''
      if (!body && templateToRender.dosya_adi) {
        body = readSystemTemplate(templateToRender.dosya_adi) || ''
      }
      if (!body) {
        if (targetSablonId) {
          return {
            success: false,
            error: `Şablon içeriği boş veya sistem dosyası okunamadı (Şablon ID: ${templateToRender.id}, Ad: ${templateToRender.ad || templateToRender.kod})`
          }
        }
      } else {
        try {
          const innerHtml = Mustache.render(body, dosyaContext)
          const fullHtml = masterHtml
            ? masterHtml.replace(/\{\{\{(?:content|icerik)\}\}\}/gi, innerHtml)
            : innerHtml
          renderedHtmlMap[templateToRender.id] = fullHtml
        } catch (renderErr: any) {
          return {
            success: false,
            error: `Mustache render hatası (${templateToRender.ad || templateToRender.kod || templateToRender.id}): ${renderErr?.message || String(renderErr)}`
          }
        }
      }
    }

    return {
      success: true,
      data: {
        sablons,
        masterHtml,
        dosyaContext,
        renderedHtmlMap,
        placeholders,
        personelListesi,
        settings: settingsMap,
        activeDosya
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
