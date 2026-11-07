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
  'birimId',
  'birim_id',
  'birimAdi',
  'birimAnteti',
  'antetSatirlari',
  'antetEkSatir',
  'butceYili',
  'solLogo',
  'sagLogo',
  'harcamaYetkilisiAdi',
  'harcamaYetkilisiUnvan',
  'onaylayanPersonelAdi',
  'onaylayanPersonelUnvan',
  'hazirlayanPersonelAdi',
  'hazirlayanPersonelUnvan',
  'gerceklestirmeGorevlisiAdi',
  'gerceklestirmeGorevlisiUnvani',
  'sunulacakMakamAdi',
  'ihtiyacYeri',
  'fiyatArastirmaGorevlileri',
  'fiyatKomisyonu',
  'muayeneKomisyonu',
  'komisyonUyeleri',
  'komisyon',
  'gorevliler',
  'gorevlendirilenler',
  'dagitimListesi',
  'rota',
  'routeOverrides'
])

export const SOURCE_FIELDS = new Set([
  'ihtiyacKalemleri',
  'kalemler',
  'items',
  'malzemeler',
  'fiyatKalemleri',
  'teklifler',
  'bids',
  'firmaTeklifleri',
  'firmaListesi',
  'firmalar',
  'invitedFirms',
  'fileFirms',
  'kazananFirma',
  'yaklasikMaliyet',
  'toplamTutar',
  'kdvTutari',
  'genelToplam',
  'grandTotal',
  'paraBirimi'
])

export type RefreshPolicyType = 'preserve' | 'source' | 'manual'

export function getFieldRefreshPolicy(fieldKey: string): RefreshPolicyType {
  if (PRESERVE_FIELDS.has(fieldKey)) return 'preserve'
  if (SOURCE_FIELDS.has(fieldKey)) return 'source'
  return 'manual'
}

function isNonEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
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
      // PRESERVE: Kullanıcının belge üzerinde veya rotada yaptığı dolu düzenlemeler senkronizasyonda korunur.
      // Snapshot'taki değer boş string ("") veya boş dizi ([]) ise kaynak verideki değer muhafaza edilir.
      if (isNonEmptyValue(val)) {
        merged[key] = val
      }
    } else if (policy === 'source') {
      // SOURCE: Veritabanındaki güncel kalem/teklif/tutar verisi esastır.
      // Yalnızca kaynak veride değer boşsa (ör. [], "", null, undefined) snapshot'taki dolu değer fallback olarak alınır.
      if (!isNonEmptyValue(merged[key]) && isNonEmptyValue(val)) {
        merged[key] = val
      }
    } else {
      // MANUAL: Kullanıcının özel girdiği metinler, gerekçeler, tarihler, şerhler ve görünüm ayarları KORUNUR.
      // Ancak snapshot'ta boş string ("") veya boş dizi ([]) varken kaynakta dolu değer varsa kaynak ezilmez.
      if (
        (typeof val === 'string' && val.trim() === '' && isNonEmptyValue(merged[key])) ||
        (Array.isArray(val) && val.length === 0 && isNonEmptyValue(merged[key]))
      ) {
        continue
      }
      merged[key] = val
    }
  }

  return merged
}

