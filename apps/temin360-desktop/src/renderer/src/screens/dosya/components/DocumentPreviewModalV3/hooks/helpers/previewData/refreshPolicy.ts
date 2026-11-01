/**
 * Refresh Policy & Field Categorization for Document Preview
 * 
 * - PRESERVE: Dosyadan miras alınan kurumsal / dosya sabitleri (asla ezilmez, tek kaynaktan gelir)
 * - SOURCE: Operasyonel dinamik veriler (kalemler, teklifler, yaklaşık maliyet - kaynaktan güncellenir)
 * - MANUAL: Kullanıcının belge üzerinde elle yaptığı canlı düzenlemeler (snapshot'tan korunur)
 */

export const PRESERVE_FIELDS = new Set([
  'evrakSayisi',
  'evrakNo',
  'dosyaNo',
  'teminNo',
  'kurumUst',
  'kurumAdi',
  'mudurluk',
  'harcamaBirimi',
  'birimAdi',
  'birimAnteti',
  'antetSatirlari',
  'antetEkSatir',
  'butceYili',
  'solLogo',
  'sagLogo',
  'harcamaYetkilisiAdi',
  'harcamaYetkilisiUnvan'
])

export const SOURCE_FIELDS = new Set([
  'ihtiyacKalemleri',
  'kalemler',
  'items',
  'teklifler',
  'bids',
  'fiyatKomisyonu',
  'muayeneKomisyonu',
  'komisyonUyeleri',
  'firmaListesi',
  'fileFirms',
  'kazananFirma',
  'yaklasikMaliyet',
  'toplamTutar',
  'grandTotal',
  'paraBirimi'
])

export type RefreshPolicyType = 'preserve' | 'source' | 'manual'

export function getFieldRefreshPolicy(fieldKey: string): RefreshPolicyType {
  if (PRESERVE_FIELDS.has(fieldKey)) return 'preserve'
  if (SOURCE_FIELDS.has(fieldKey)) return 'source'
  return 'manual'
}

/**
 * Akıllı Belge Birleştirici (Smart Merge with Refresh Policy)
 * 
 * @param sourceData DB ve kurumsal başlıktan taze çekilen dinamik veriler
 * @param savedSnapshot Kullanıcının önceden kaydettiği veya canlı düzenlediği snapshot verileri
 * @returns Refresh Policy kurallarına göre harmanlanmış nihai veri
 */
export function applyRefreshPolicy(
  sourceData: Record<string, any>,
  savedSnapshot?: Record<string, any> | null
): Record<string, any> {
  const merged: Record<string, any> = { ...sourceData }
  if (!savedSnapshot || typeof savedSnapshot !== 'object') {
    return merged
  }

  for (const [key, val] of Object.entries(savedSnapshot)) {
    if (val === undefined || val === null) continue

    const policy = getFieldRefreshPolicy(key)

    if (policy === 'preserve') {
      // PRESERVE: Dosyadan gelen güncel değer önceliklidir (kalıtım)
      // Ancak dosyada henüz yoksa snapshot'taki değeri koru
      if (!merged[key] || String(merged[key]).trim() === '') {
        merged[key] = val
      }
    } else if (policy === 'source') {
      // SOURCE: Veritabanındaki güncel kalem/teklif listesi esastır.
      // Yalnızca kaynak veride hiç kalem yoksa snapshot'takini fallback olarak al
      if (Array.isArray(merged[key]) && merged[key].length === 0 && Array.isArray(val) && val.length > 0) {
        merged[key] = val
      }
    } else {
      // MANUAL: Kullanıcının özel girdiği metinler, gerekçeler, tarihler, şerhler KORUNUR
      merged[key] = val
    }
  }

  return merged
}

