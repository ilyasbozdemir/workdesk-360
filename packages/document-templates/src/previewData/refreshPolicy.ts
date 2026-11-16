/**
 * Refresh Policy & Field Categorization for Document Preview
 *
 * MİMARİ İLKE: Her şablon kendi liste ve veri yapısının sahibidir.
 *
 * - PRESERVE: Dosyadan miras alınan kurumsal / dosya sabitleri (snapshot'ta doluysa korunur)
 * - SOURCE: Ham veritabanı ve dinamik maliyet alanları (items, bids, yaklasikMaliyet vb. - kaynak güncel tutulur)
 * - MANUAL: Şablon içeriği, tablo kalemleri, metinler ve düzenlemeler
 *           (Kullanıcının şablon üzerinde yaptığı tüm tablo ve alan düzenlemeleri snapshot'tan tam korunur).
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

/**
 * Komisyon kadrosu ve rota görevlileri alanları.
 * Dosyada komisyon güncellendiğinde veya "Yenile" dendiğinde veritabanındaki
 * güncel komisyon üyeleri snapshot'taki eski kişilerin üzerine yazılarak (ezerek) çekilir.
 */
export const COMMISSION_PERSONNEL_FIELDS = new Set([
  'fiyatArastirmaGorevlileri',
  'fiyatKomisyonu',
  'muayeneKomisyonu',
  'komisyonUyeleri',
  'komisyon',
  'gorevliler',
  'gorevlendirilenler',
  'dagitimListesi',
  'harcamaYetkilisiAdi',
  'harcamaYetkilisiUnvan',
  'onaylayanPersonelAdi',
  'onaylayanPersonelUnvan',
  'hazirlayanPersonelAdi',
  'hazirlayanPersonelUnvan',
  'gerceklestirmeGorevlisiAdi',
  'gerceklestirmeGorevlisiUnvani',
  'rota',
  'routeOverrides',
  'slots'
])

export const SOURCE_FIELDS = new Set([
  'items',
  'bids',
  'fileFirms',
  'invitedFirms',
  'rawFirms',
  'dbKalemler',
  'paraBirimi',
  'ihtiyacKalemleri',
  'fiyatKalemleri',
  'yaklasikMaliyet',
  'toplamTutar'
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

export interface RefreshPolicyOptions {
  /**
   * Dosyada komisyon veya personel kadrosu güncellendiğinde, "Yenile" dendiğinde
   * belgedeki eski komisyon üyelerini ve görevlileri veritabanından gelen
   * güncel kadroyla ezer (Smart Rebase).
   * @default true
   */
  overwritePersonnel?: boolean
}

/**
 * Akıllı Belge Birleştirici (Smart Merge with Refresh Policy)
 *
 * @param sourceData DB ve kurumsal başlıktan çekilen taze kaynak veriler
 * @param savedSnapshot Kullanıcının önceden kaydettiği veya canlı düzenlediği snapshot verileri
 * @param options Yenileme politikası opsiyonları
 * @returns Refresh Policy kurallarına göre harmanlanmış nihai veri
 */
export function applyRefreshPolicy(
  sourceData: Record<string, any>,
  savedSnapshot?: Record<string, any> | null,
  options?: RefreshPolicyOptions
): Record<string, any> {
  const merged: Record<string, any> = { ...sourceData }
  if (!savedSnapshot || typeof savedSnapshot !== 'object') {
    return merged
  }

  const shouldOverwritePersonnel = options?.overwritePersonnel === true

  for (const [key, val] of Object.entries(savedSnapshot)) {
    if (val === undefined || val === null) continue

    const policy = getFieldRefreshPolicy(key)

    if (policy === 'preserve') {
      // KOMİSYON & PERSONEL EZME KURALI:
      // Kullanıcı komisyonu güncelledikten sonra belgede "Yenile" dediğinde,
      // veritabanından gelen güncel komisyon kadrosu snapshot'taki eski kişileri ezer!
      if (shouldOverwritePersonnel && COMMISSION_PERSONNEL_FIELDS.has(key)) {
        if (isNonEmptyValue(sourceData[key])) {
          // Kaynaktaki güncel veriyi koru, snapshot'taki eski kişiyi yazma!
          continue
        }
      }

      // PRESERVE: Kullanıcının belge üzerinde veya rotada yaptığı dolu düzenlemeler senkronizasyonda korunur.
      // Özel İstisna (sunulacakMakamAdi): Eğer snapshot'taki değer yalnızca kurumun çıplak adıysa
      // ve kaynak veride güncel bir sunulacak makam (örn: ... MAKAMINA) çözümlendiyse, güncel makamı koru!
      if (key === 'sunulacakMakamAdi' && isNonEmptyValue(merged[key])) {
        const kAdi = String(sourceData.kurumAdi || '').trim().toLowerCase()
        const sKurum = String(sourceData.sunulacakKurumAdi || '').trim().toLowerCase()
        const valStr = String(val).trim().toLowerCase()
        const isBareKurumVal = (kAdi && valStr === kAdi) || (sKurum && valStr === sKurum) || !valStr.toUpperCase().includes('MAKAM')
        if (isBareKurumVal && isNonEmptyValue(merged[key])) {
          continue
        }
      }
      if (isNonEmptyValue(val)) {
        merged[key] = val
      }
    } else if (policy === 'source') {
      // SOURCE: Ham veritabanı önbellekleri için kaynak veride değer boşsa snapshot'taki dolu değer fallback olarak alınır.
      if (!isNonEmptyValue(merged[key]) && isNonEmptyValue(val)) {
        merged[key] = val
      }
    } else {
      // MANUAL / ŞABLON İÇERİĞİ:
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

