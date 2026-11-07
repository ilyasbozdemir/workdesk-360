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
    const dosyaId = Number(payload?.dosyaId || 0)
    const targetSablonId = payload?.sablonId
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
    const payloadRes = resolveDocumentPayload(db, {
      dosyaId,
      documentId: targetDocId
    })
    const payloadData = payloadRes?.success && payloadRes.data ? payloadRes.data : {}

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
      id: activeDosya?.id || 0,
      dosya_no: activeDosya?.temin_no || resolvedContext.teminNo || '',
      isin_tanimi: activeDosya?.isin_aciklamasi || activeDosya?.konu || resolvedContext.isinTanimi || '',
      butce_yili: activeDosya?.butce_yili || resolvedContext.butceYili || new Date().getFullYear().toString(),
      firmalar: fileFirms,
      firmaListesi: fileFirms,
      harcamaYetkilisi: {
        adSoyad: activeDosya?.onaylayan_ad_soyad || resolvedContext.onaylayanPersonelAdi || '',
        unvan: activeDosya?.onaylayan_unvan || resolvedContext.onaylayanPersonelUnvan || 'Harcama Yetkilisi',
        telefon: activeDosya?.onaylayan_telefon || ''
      },
      gerceklestirmeGorevlisi: {
        adSoyad: activeDosya?.hazirlayan_ad_soyad || resolvedContext.hazirlayanPersonelAdi || '',
        unvan: activeDosya?.hazirlayan_unvan || resolvedContext.hazirlayanPersonelUnvan || 'Gerçekleştirme Görevlisi',
        telefon: activeDosya?.hazirlayan_telefon || ''
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

    // 6. Sadece hedeflenen tek bir sablonId varsa render et
    const renderedHtmlMap: Record<number, string> = {}
    if (payload?.sablonId) {
      const targetSab = sablons.find((s: any) => s.id === payload.sablonId)
      if (targetSab) {
        try {
          let body = targetSab.html_icerik || ''
          if (!body && targetSab.dosya_adi) {
            body = readSystemTemplate(targetSab.dosya_adi) || ''
          }
          if (body) {
            const innerHtml = Mustache.render(body, dosyaContext)
            const fullHtml = masterHtml ? masterHtml.replace('{{{content}}}', innerHtml) : innerHtml
            renderedHtmlMap[targetSab.id] = fullHtml
          }
        } catch {}
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
