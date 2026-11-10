/**
 * Belge Akıllı Birleştirme Modülü (Smart Merge / Rebase)
 * - Kaydedilmiş kullanıcı düzenlemelerini (notlar, açıklamalar, özel metinler) korur.
 * - Kaynak veritabanından gelen yeni kalemleri, güncel miktarları ve güncel antet verilerini güvenle ekler.
 */

export interface SmartMergeOptions {
  /**
   * Kalem eşleştirmede kullanılacak birincil anahtarlar (varsayılan: ['id', 'tasinirKodu', 'tasinir_kodu', 'siraNo'])
   */
  itemMatchKeys?: string[]
  /**
   * Kalemlerde kaynak verinin öncelikli olduğu alanlar (örn. miktar, birim, kdv, fiyat)
   */
  sourcePriorityFields?: string[]
}

const DEFAULT_ITEM_MATCH_KEYS = ['id', 'tasinirKodu', 'tasinir_kodu', 'siraNo', 'sira_no']
const DEFAULT_SOURCE_PRIORITY_FIELDS = [
  'miktar',
  'birim',
  'birimi',
  'kdvOrani',
  'kdv_orani',
  'birimFiyat',
  'birim_fiyat',
  'toplamTutar',
  'toplam_tutar'
]

/**
 * İki kalem nesnesinin aynı kaleme ait olup olmadığını kontrol eder.
 */
function isSameItem(a: any, b: any, matchKeys: string[]): boolean {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  for (const key of matchKeys) {
    if (a[key] !== undefined && b[key] !== undefined && a[key] !== null && b[key] !== null) {
      if (String(a[key]).trim() === String(b[key]).trim() && String(a[key]).trim() !== '') {
        return true
      }
    }
  }
  return false
}

/**
 * @purpose Kaydedilmiş snapshot ile veritabanından taze çözümlenen veriyi akıllıca birleştirir (Rebase / Smart Merge).
 * @source DATA_TeminBelgeSnapshot (kullanıcı düzenlemeleri) + Canlı SQLite tabloları (taze kalemler/fiyatlar)
 * @scope dosyaId, templateKey
 * @usedBy DocumentEngine.loadOrCreateDocument, DocumentPreviewModalV3
 * @see packages/document-engine/src/DocumentEngine.ts
 *
 * Kullanıcının manuel düzenlemelerini korur (açıklamalar, unvanlar, sunulacak makam vb.).
 * Canlı veritabanından eklenen yeni kalemleri ve güncel fiyatları güvenle snapshot'a ekler.
 */
export function smartMergeDocumentData<T extends Record<string, unknown> = Record<string, unknown>>(
  existingSnapshot: T,
  freshSourceData: T,
  options?: SmartMergeOptions
): T {
  if (!existingSnapshot) return { ...freshSourceData }
  if (!freshSourceData) return { ...existingSnapshot }

  const matchKeys = options?.itemMatchKeys || DEFAULT_ITEM_MATCH_KEYS
  const sourcePriorityFields = options?.sourcePriorityFields || DEFAULT_SOURCE_PRIORITY_FIELDS

  const merged: Record<string, unknown> = { ...existingSnapshot }

  // 1. Antet ve genel üst verileri kaynaktan güncelle
  const headerFields = ['antetSatirlari', 'kurumUst', 'kurumAdi', 'mudurluk', 'solLogo', 'sagLogo']
  for (const hf of headerFields) {
    if (freshSourceData[hf] !== undefined) {
      merged[hf] = freshSourceData[hf]
    }
  }

  // 2. Kalem dizilerini (ihtiyacKalemleri, kalemler, items, malzemeler, fiyatKalemleri) akıllı birleştir
  const arrayFieldNames = ['ihtiyacKalemleri', 'kalemler', 'items', 'malzemeler', 'fiyatKalemleri']

  for (const arrField of arrayFieldNames) {
    const existingArr = existingSnapshot[arrField]
    const freshArr = freshSourceData[arrField]

    if (Array.isArray(freshArr)) {
      if (!Array.isArray(existingArr) || existingArr.length === 0) {
        merged[arrField] = [...freshArr]
        continue
      }

      const mergedList: unknown[] = []

      // Taze kaynaktaki her kalemi incele
      for (let i = 0; i < freshArr.length; i++) {
        const freshItem = freshArr[i]
        const existingItem = existingArr.find((e) => isSameItem(e, freshItem, matchKeys))

        if (existingItem) {
          // Mevcut kalem: Kullanıcının özel düzenlemelerini koru, kaynaktaki miktar/fiyat alanlarını güncelle
          const combinedItem = { ...existingItem }
          for (const spf of sourcePriorityFields) {
            if (freshItem[spf] !== undefined) {
              combinedItem[spf] = freshItem[spf]
            }
          }
          mergedList.push(combinedItem)
        } else {
          // Yeni eklenen kalem: Doğrudan ekle
          mergedList.push({ ...freshItem })
        }
      }

      merged[arrField] = mergedList
    }
  }

  // 3. Kaynak dinamik parasal tutarları ve para birimini güncelle
  const sourceAmountFields = [
    'yaklasikMaliyet',
    'yaklasik_maliyet',
    'toplamTutar',
    'toplam_tutar',
    'kdvTutari',
    'kdv_tutari',
    'genelToplam',
    'genel_toplam',
    'grandTotal',
    'paraBirimi'
  ]
  for (const saf of sourceAmountFields) {
    if (freshSourceData[saf] !== undefined && freshSourceData[saf] !== null) {
      merged[saf] = freshSourceData[saf]
    }
  }

  // 4. Eksik olan yeni alanları tamamla (kaynakta olup snapshot'ta hiç olmayan alanlar)
  for (const [key, value] of Object.entries(freshSourceData)) {
    if (merged[key] === undefined) {
      merged[key] = value
    }
  }

  return merged as T
}

