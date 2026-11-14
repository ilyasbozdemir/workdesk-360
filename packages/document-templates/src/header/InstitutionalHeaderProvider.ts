import {
  DocumentHeaderContext,
  DocumentHeaderProvider,
  InstitutionalHeaderData
} from '@worksuite-360/document-engine'
import {
  HeaderDefinition,
  HeaderLineDefinition,
  getHeaderLines,
  validateHeaderDefinition
} from '@temin360/contracts'

export interface HeaderResolutionContext {
  settings?: Record<string, any>
  document?: Record<string, any>
  manual?: Record<string, any>
  kurumRow?: Record<string, any> | null
  dosyaRow?: Record<string, any> | null
  matchedBirim?: Record<string, any> | null
  fallbackInstitutionName?: string
}

export interface InstitutionalHeaderSettings {
  activeKurumId?: number | string | null
  institutionName?: string
  departmentName?: string
  logoLeft?: string | null
  logoRight?: string | null
  institutionLogo?: string | null
}

export type EvrakSayisiResolverFn = (
  dosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
) => Promise<string>

export interface BirimAntetResolutionInput {
  birimId?: number | string | null
  birimAdi?: string | null
  birimList?: any[]
  kurumRow?: Record<string, any> | null
  personelList?: any[]
  baseAntetLines?: string[]
  dosyaAntetEkSatir?: string | null
  fallbackInstitutionName?: string
}

export interface BirimAntetResolutionResult {
  birimId?: number | string
  birimAdi: string
  antetEkSatir: string
  antetSatirlari: string[]
  mudurluk: string
  harcamaBirimi: string
  ihtiyacYeri: string
  sunulacakMakamAdi: string
  harcamaYetkilisiId?: number
  harcamaYetkilisiAdi?: string
  harcamaYetkilisiUnvan?: string
  gerceklestirmeGorevlisiId?: number
  gerceklestirmeGorevlisiAdi?: string
  gerceklestirmeGorevlisiUnvan?: string
  ilgiliPersonelId?: number
  ilgiliPersonelAdi?: string
  ilgiliPersonelUnvan?: string
  matchedBirim: Record<string, any> | null
  birimFound: boolean
  birimPassive: boolean
  warning?: string
}

/**
 * Birim ek satırında DETSİS veya eski içe aktarımdan kalma hiyerarşi ("Kurum Adı > Birim Adı")
 * veya kurum ön eki varsa temizleyip saf birim adını döner.
 * Kurum adıyla tamamen aynı bir metin girildiyse (birim yerine kurum adı tekrarlanmışsa)
 * boş metin ('') dönerek asıl birim adının devreye girmesini sağlar.
 */
export function sanitizeBirimAntetSatiri(
  text?: string | null,
  kurumAdi?: string | null
): string {
  if (!text) return ''
  let cleaned = String(text).trim()

  // 1. Eğer metinde ">" hiyerarşi ayracı varsa sadece en son birim adını al
  if (cleaned.includes('>')) {
    const parts = cleaned.split('>').map((p) => p.trim()).filter(Boolean)
    cleaned = parts[parts.length - 1] || cleaned
  }

  // 2. Eğer metin kurum adıyla başlıyorsa ve arkasından birim geliyorsa kurum adını temizle
  if (kurumAdi && String(kurumAdi).trim()) {
    const kUpper = String(kurumAdi).trim().toLocaleUpperCase('tr-TR')
    const cUpper = cleaned.toLocaleUpperCase('tr-TR')
    if (cUpper.startsWith(kUpper) && cUpper.length > kUpper.length) {
      cleaned = cleaned.slice(String(kurumAdi).trim().length).replace(/^[>\s:/-]+/, '').trim()
    }
  }

  // 3. Olası kalan ">" veya baştaki/sondaki gereksiz karakterleri temizle
  if (cleaned.includes('>')) {
    const parts = cleaned.split('>').map((p) => p.trim()).filter(Boolean)
    cleaned = parts[parts.length - 1] || cleaned
  }

  return cleaned.trim()
}

/**
 * Kurumsal ve Antet Bilgileri Sağlayıcısı (Institutional Header Provider)
 * - Belgeye özel alanlar, kalemler veya tekliflerle ilgilenmez.
 * - Sadece kurum, birim ve dosya üst verilerini çözümler.
 * - Oturum içi önbellekleme yaparak gereksiz tekrar eden sorguları önler.
 */
export class InstitutionalHeaderProvider
  implements DocumentHeaderProvider<InstitutionalHeaderData> {
  private static cache = new Map<number, InstitutionalHeaderData>()
  private static settingsGetter: (() => InstitutionalHeaderSettings) | null = null
  private static evrakSayisiResolver: EvrakSayisiResolverFn | null = null

  static sanitizeBirimAntetSatiri = sanitizeBirimAntetSatiri

  static setSettingsGetter(getter: () => InstitutionalHeaderSettings): void {
    this.settingsGetter = getter
  }

  static setEvrakSayisiResolver(resolver: EvrakSayisiResolverFn | null): void {
    this.evrakSayisiResolver = resolver
  }

  /**
   * TANIM_Kurum satırından veya varsayılan kurum bilgisinden temel antet satırlarını üretir.
   * Birim satırı eklenmeden önceki kurumsal üst başlığı (T.C., Üst Kurum, Kurum Adı) döndürür.
   */
  static parseKurumBaseAntetLines(
    kurumRow?: Record<string, any> | null,
    fallbackInstitutionName?: string
  ): string[] {
    let lines: string[] = []
    if (kurumRow?.kurum_anteti) {
      try {
        const parsed =
          typeof kurumRow.kurum_anteti === 'string'
            ? JSON.parse(kurumRow.kurum_anteti)
            : kurumRow.kurum_anteti
        if (Array.isArray(parsed)) {
          lines = parsed
            .map((s: unknown) => String(s ?? '').trim())
            .filter(Boolean)
            .filter((line: string) => !line.includes('>'))
        }
      } catch {
        if (typeof kurumRow.kurum_anteti === 'string' && kurumRow.kurum_anteti.trim()) {
          lines = kurumRow.kurum_anteti
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .filter((line: string) => !line.includes('>'))
        }
      }
    }

    if (lines.length === 0) {
      const built: string[] = ['T.C.']
      if (kurumRow?.ust_kurum_adi && String(kurumRow.ust_kurum_adi).trim()) {
        built.push(String(kurumRow.ust_kurum_adi).trim().toUpperCase())
      }
      const kurumAdiText =
        kurumRow?.kurum_adi ||
        kurumRow?.ad ||
        fallbackInstitutionName ||
        ''
      if (kurumAdiText && String(kurumAdiText).trim()) {
        const upperKurum = String(kurumAdiText).trim().toUpperCase()
        if (!built.some((b) => b.toUpperCase() === upperKurum)) {
          built.push(upperKurum)
        }
      }
      if (built.length === 1 && fallbackInstitutionName) {
        built.push(String(fallbackInstitutionName).trim().toUpperCase())
      }
      lines = built
    }

    return lines
  }

  /**
   * Key tabanlı, dinamik kaynak eşlemeli antet çözümleyicisi (Codex Görevi).
   * Şablonun HeaderDefinition tanımındaki satırları (fields/lines), sıralamayı ve
   * veri kaynaklarını ("settings" | "document" | "manual") sırasıyla çözümler.
   */
  static resolveDynamicHeader(
    definition: HeaderDefinition,
    context: HeaderResolutionContext = {}
  ): string[] {
    validateHeaderDefinition(definition)
    const linesDef = getHeaderLines(definition)

    const institutionName =
      context.fallbackInstitutionName ||
      context.kurumRow?.kurum_adi ||
      context.kurumRow?.ad ||
      context.settings?.institutionName ||
      ''

    const resolvedLines: string[] = []
    const seenTextUpper = new Set<string>()

    const getDeep = (obj: any, path: string): any => {
      if (!obj || !path) return undefined
      if (obj[path] !== undefined) return obj[path]
      const parts = path.split('.')
      let curr = obj
      for (const p of parts) {
        if (curr === null || curr === undefined) return undefined
        curr = curr[p]
      }
      return curr
    }

    for (const lineDef of linesDef) {
      if (lineDef.visible === false) {
        continue
      }

      let rawVal: any = undefined

      switch (lineDef.source) {
        case 'settings': {
          rawVal = getDeep(context.settings, lineDef.path)
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
            if (lineDef.key === 'countryPrefix' || lineDef.path === 'countryPrefix') {
              rawVal = 'T.C.'
            } else if (
              lineDef.key === 'institutionName' ||
              lineDef.path === 'institutionName' ||
              lineDef.path === 'kurum_adi'
            ) {
              rawVal =
                context.kurumRow?.kurum_adi ||
                context.kurumRow?.ad ||
                context.settings?.institutionName ||
                institutionName
            } else if (
              lineDef.key === 'parentInstitution' ||
              lineDef.path === 'parentInstitution' ||
              lineDef.path === 'ust_kurum_adi'
            ) {
              rawVal =
                context.kurumRow?.ust_kurum_adi ||
                context.settings?.parentInstitution
            }
          }
          break
        }

        case 'document': {
          rawVal = getDeep(context.document, lineDef.path)
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
            if (
              lineDef.key === 'tenderUnit' ||
              lineDef.path.includes('resolvedTenderUnit') ||
              lineDef.path === 'birimAdi' ||
              lineDef.path === 'birim_adi'
            ) {
              rawVal =
                context.matchedBirim?.birim_adi ||
                context.matchedBirim?.ad ||
                context.dosyaRow?.birim_adi ||
                context.document?.birimAdi ||
                context.document?.birim_adi ||
                context.document?.birim ||
                context.document?.mudurluk
            } else if (
              lineDef.key === 'antetEkSatir' ||
              lineDef.path.includes('antetEkSatir')
            ) {
              rawVal =
                context.matchedBirim?.antet_ek_satir ||
                context.dosyaRow?.antet_ek_satir ||
                context.document?.antetEkSatir
            } else if (
              lineDef.key === 'sunulacakMakam' ||
              lineDef.path.includes('sunulacakMakam')
            ) {
              rawVal =
                context.document?.sunulacakMakamAdi ||
                context.document?.sunulacakMakam ||
                context.dosyaRow?.sunulacak_makam ||
                context.kurumRow?.makam_adi
            }
          }
          break
        }

        case 'manual': {
          rawVal = getDeep(context.manual, lineDef.path)
          if (rawVal === undefined && context.document?.antetSatirlari) {
            rawVal = getDeep(context.document.antetSatirlari, lineDef.path)
          }
          break
        }
      }

      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
        if (lineDef.fallback && String(lineDef.fallback).trim() !== '') {
          rawVal = lineDef.fallback
        }
      }

      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
        continue
      }

      let text = String(rawVal).trim()
      text = this.sanitizeBirimAntetSatiri(text, institutionName)

      if (!text) {
        continue
      }

      // Resmî Yönetmelik biçimlendirmesi:
      // T.C. satırı aynen korunur
      // Kurum / Üst Kurum satırları BÜYÜK HARFLE yazılır
      // Birim satırları Baş Harfleri Büyük olarak korunur
      const upperKey = lineDef.key.toLowerCase()
      if (upperKey === 'countryprefix' || text.toUpperCase() === 'T.C.') {
        text = 'T.C.'
      } else if (
        upperKey === 'parentinstitution' ||
        upperKey === 'institutionname' ||
        upperKey.includes('kurum')
      ) {
        text = text.toLocaleUpperCase('tr-TR')
      }

      const norm = text.toLocaleUpperCase('tr-TR')
      if (seenTextUpper.has(norm)) {
        continue
      }
      seenTextUpper.add(norm)
      resolvedLines.push(text)
    }

    return resolvedLines.length > 0 ? resolvedLines : ['T.C.']
  }

  /**
   * Temel kurum antet satırları ile seçili birimin antet_ek_satir / birim_adi bilgisini
   * mükerrer satır oluşturmadan birleştirir.
   */
  static composeBirimAntetLines(
    baseLines: string[],
    birimOrEkSatir?: Record<string, any> | string | null,
    dosyaAntetEkSatir?: string | null,
    knownBirimNames?: string[],
    fallbackInstitutionName?: string
  ): string[] {
    const cleanBase: string[] = []
    let extractedBirimFromBase = ''

    if (Array.isArray(baseLines)) {
      for (const line of baseLines) {
        const str = String(line ?? '').trim()
        if (!str) continue
        if (str.includes('>')) {
          const cleanB = this.sanitizeBirimAntetSatiri(str, fallbackInstitutionName)
          if (cleanB && !extractedBirimFromBase) {
            extractedBirimFromBase = cleanB
          }
        } else {
          cleanBase.push(str)
        }
      }
    }

    // Eğer bilinen birim adları verildiyse ve temel antet dizisinin son satırı eski bir birime aitse onu çıkar
    let result = [...cleanBase]
    if (knownBirimNames && knownBirimNames.length > 0 && result.length > 2) {
      const normalizedKnown = new Set(
        knownBirimNames.map((n) => String(n ?? '').trim().toLocaleUpperCase('tr-TR')).filter(Boolean)
      )
      const lastLineUpper = result[result.length - 1].toLocaleUpperCase('tr-TR')
      if (normalizedKnown.has(lastLineUpper)) {
        result = result.slice(0, -1)
      }
    }

    let ekSatir = ''
    if (typeof birimOrEkSatir === 'string' && birimOrEkSatir.trim()) {
      ekSatir = birimOrEkSatir.trim()
    } else if (birimOrEkSatir && typeof birimOrEkSatir === 'object') {
      ekSatir = String(
        birimOrEkSatir.antet_ek_satir ||
          birimOrEkSatir.birim_antet_ek_satir ||
          birimOrEkSatir.birim_adi ||
          birimOrEkSatir.birim_tablo_adi ||
          birimOrEkSatir.ad ||
          ''
      ).trim()
    }

    if (!ekSatir && dosyaAntetEkSatir && String(dosyaAntetEkSatir).trim()) {
      ekSatir = String(dosyaAntetEkSatir).trim()
    }

    if (!ekSatir && extractedBirimFromBase) {
      ekSatir = extractedBirimFromBase
    }

    ekSatir = this.sanitizeBirimAntetSatiri(ekSatir, fallbackInstitutionName)

    if (
      ekSatir &&
      !result.some(
        (s) => s.trim().toLocaleUpperCase('tr-TR') === ekSatir.toLocaleUpperCase('tr-TR')
      )
    ) {
      result.push(ekSatir)
    }

    return result.length > 0 ? result : ['T.C.']
  }

  /**
   * Seçili birimId veya birimAdi üzerinden TANIM_Birim + TANIM_Kurum + TANIM_Personel
   * ilişkilerini tek merkezden çözümler. Birim bulunamadığında veya pasif olduğunda
   * güvenli fallback ve uyarı (warning) döndürür.
   */
  static resolveBirimSelection(input: BirimAntetResolutionInput): BirimAntetResolutionResult {
    const {
      birimId,
      birimAdi,
      birimList = [],
      kurumRow = null,
      personelList = [],
      baseAntetLines,
      dosyaAntetEkSatir,
      fallbackInstitutionName
    } = input

    const knownBirimNames: string[] = []
    for (const b of birimList) {
      if (!b) continue
      if (b.birim_adi) knownBirimNames.push(String(b.birim_adi))
      if (b.ad) knownBirimNames.push(String(b.ad))
      if (b.antet_ek_satir) knownBirimNames.push(String(b.antet_ek_satir))
    }

    const effectiveBaseLines =
      baseAntetLines && baseAntetLines.length > 0
        ? baseAntetLines
        : this.parseKurumBaseAntetLines(kurumRow, fallbackInstitutionName)

    const hasExplicitId =
      birimId !== undefined && birimId !== null && String(birimId).trim() !== '' && Number(birimId) !== 0
    const cleanBirimAdi = typeof birimAdi === 'string' ? birimAdi.trim() : ''

    let matchedBirim: Record<string, any> | null = null
    if (hasExplicitId && Array.isArray(birimList)) {
      matchedBirim =
        birimList.find(
          (b: any) => b && (Number(b.id) === Number(birimId) || String(b.id) === String(birimId).trim())
        ) || null
    }
    if (!matchedBirim && cleanBirimAdi && Array.isArray(birimList)) {
      const targetUpper = cleanBirimAdi.toLocaleUpperCase('tr-TR')
      matchedBirim =
        birimList.find((b: any) => {
          if (!b) return false
          return [b.birim_adi, b.ad, b.kisa_ad, b.antet_ek_satir]
            .filter(Boolean)
            .some((val) => String(val).trim().toLocaleUpperCase('tr-TR') === targetUpper)
        }) || null
    }

    const birimFound = Boolean(matchedBirim)
    const birimPassive = Boolean(
      matchedBirim &&
        (matchedBirim.aktif_mi === 0 ||
          matchedBirim.aktif_mi === '0' ||
          matchedBirim.aktif_mi === false ||
          matchedBirim.is_active === 0 ||
          matchedBirim.is_active === false)
    )

    let warning: string | undefined
    if (hasExplicitId && !birimFound && birimList.length > 0) {
      warning = `Seçili birim (ID: ${birimId}) birim tanımlarında bulunamadı. Varsayılan kurum anteti kullanılıyor.`
    } else if (!hasExplicitId && cleanBirimAdi && !birimFound && birimList.length > 0) {
      warning = `"${cleanBirimAdi}" birimi TANIM_Birim kayıtlarında bulunamadı.`
    } else if (birimPassive && matchedBirim) {
      const bName = matchedBirim.birim_adi || matchedBirim.ad || String(birimId)
      warning = `"${bName}" birimi pasif durumdadır.`
    }

    const resolvedBirimAdi = sanitizeBirimAntetSatiri(
      matchedBirim?.birim_adi ||
      matchedBirim?.ad ||
      cleanBirimAdi ||
      '',
      fallbackInstitutionName || kurumRow?.kurum_adi
    )

    const institutionNameUpper = String(fallbackInstitutionName || kurumRow?.kurum_adi || '')
      .trim()
      .toLocaleUpperCase('tr-TR')

    let rawAntetEkSatir =
      (matchedBirim?.antet_ek_satir && String(matchedBirim.antet_ek_satir).trim()) || ''

    // Eğer veritabanındaki antet_ek_satir yalnızca kurum adının aynısı ise, geçersiz say ve birim adını al
    if (
      !rawAntetEkSatir ||
      (institutionNameUpper && rawAntetEkSatir.toLocaleUpperCase('tr-TR') === institutionNameUpper)
    ) {
      rawAntetEkSatir =
        resolvedBirimAdi ||
        (dosyaAntetEkSatir && String(dosyaAntetEkSatir).trim()) ||
        ''
    }

    let resolvedAntetEkSatir = sanitizeBirimAntetSatiri(
      rawAntetEkSatir,
      fallbackInstitutionName || kurumRow?.kurum_adi
    )

    // Temizleme sonrası metin boşsa veya kurum adına eşitse mutlaka saf birim adını kullan
    if (
      !resolvedAntetEkSatir ||
      (institutionNameUpper && resolvedAntetEkSatir.toLocaleUpperCase('tr-TR') === institutionNameUpper)
    ) {
      resolvedAntetEkSatir = resolvedBirimAdi
    }

    const antetSatirlari = resolvedAntetEkSatir
      ? this.composeBirimAntetLines(
          effectiveBaseLines,
          resolvedAntetEkSatir,
          dosyaAntetEkSatir,
          knownBirimNames,
          fallbackInstitutionName || kurumRow?.kurum_adi
        )
      : effectiveBaseLines

    const effectiveKurumMakam = kurumRow?.sunulacak_makam_secimi === 'kurum'
      ? (kurumRow?.sunulacak_kurum_adi || kurumRow?.makam_adi || kurumRow?.kurum_adi || '')
      : (kurumRow?.makam_adi_custom || kurumRow?.makam_adi || (kurumRow?.kurum_adi ? `${kurumRow.kurum_adi} MAKAMINA` : ''))

    const birimMakam = matchedBirim?.sunum_makami ? String(matchedBirim.sunum_makami).trim() : ''
    const isBirimBareKurum = Boolean(
      birimMakam && (
        birimMakam === kurumRow?.kurum_adi ||
        birimMakam === kurumRow?.sunulacak_kurum_adi ||
        (kurumRow?.kurum_adi && birimMakam.toLowerCase().includes(String(kurumRow.kurum_adi).toLowerCase())) ||
        (kurumRow?.sunulacak_kurum_adi && birimMakam.toLowerCase().includes(String(kurumRow.sunulacak_kurum_adi).toLowerCase()))
      )
    )

    const sunulacakMakamAdi = String(
      (kurumRow?.sunulacak_makam_secimi === 'makam' && isBirimBareKurum && effectiveKurumMakam)
        ? effectiveKurumMakam
        : (birimMakam || effectiveKurumMakam || '')
    ).trim()

    const ihtiyacYeri = String(
      matchedBirim?.ihtiyac_yeri_eki ||
        resolvedBirimAdi ||
        ''
    ).trim()

    // Birim & Müdürlük Yönetimi ve Personel Yönetimi bağlantısı:
    // İlgili birime ait personelleri bul
    const unitPersons = Array.isArray(personelList) && matchedBirim
      ? personelList.filter((p: any) => {
          if (!p) return false
          const pBId = p.birim_id ?? p.birimId
          if (pBId !== undefined && pBId !== null && matchedBirim.id !== undefined && matchedBirim.id !== null) {
            if (Number(pBId) === Number(matchedBirim.id)) return true
          }
          const pBirim = String(p.birim || p.birim_adi || '').trim().toLocaleLowerCase('tr-TR')
          const targetBName = String(matchedBirim.birim_adi || matchedBirim.ad || '').trim().toLocaleLowerCase('tr-TR')
          return Boolean(pBirim && targetBName && pBirim === targetBName)
        })
      : []

    let harcamaYetkilisiAdi: string | undefined
    let harcamaYetkilisiUnvan: string | undefined = matchedBirim?.harcama_yetkilisi_unvan || undefined
    const harcamaYetkilisiId = matchedBirim?.harcama_yetkilisi_id
      ? Number(matchedBirim.harcama_yetkilisi_id)
      : undefined

    if (harcamaYetkilisiId && Array.isArray(personelList) && personelList.length > 0) {
      const hp = personelList.find((p: any) => p && Number(p.id) === harcamaYetkilisiId)
      if (hp) {
        harcamaYetkilisiAdi = hp.ad_soyad || hp.adSoyad || ''
        harcamaYetkilisiUnvan = harcamaYetkilisiUnvan || hp.unvan || 'Harcama Yetkilisi'
      }
    }

    // Birim üzerinde yetkili tanımlı değilse birimin amiri/müdürü konumundaki personeli otomatik bağla
    if (!harcamaYetkilisiAdi && unitPersons.length > 0) {
      const boss = unitPersons.find((p: any) => {
        const u = String(p.unvan || '').toLocaleLowerCase('tr-TR')
        return (
          u.includes('müdür') ||
          u.includes('mudur') ||
          u.includes('başkan') ||
          u.includes('yetkili') ||
          u.includes('amir') ||
          u.includes('şube müdürü')
        )
      }) || unitPersons[0]
      if (boss) {
        harcamaYetkilisiAdi = boss.ad_soyad || boss.adSoyad || ''
        harcamaYetkilisiUnvan = harcamaYetkilisiUnvan || boss.unvan || 'Harcama Yetkilisi'
      }
    }

    let gerceklestirmeGorevlisiAdi: string | undefined
    let gerceklestirmeGorevlisiUnvan: string | undefined =
      matchedBirim?.gerceklestirme_gorevlisi_unvan || undefined
    const gerceklestirmeGorevlisiId =
      matchedBirim?.gerceklestirme_gorevlisi_id || matchedBirim?.ilgili_personel_id
        ? Number(matchedBirim.gerceklestirme_gorevlisi_id || matchedBirim.ilgili_personel_id)
        : undefined

    if (gerceklestirmeGorevlisiId && Array.isArray(personelList) && personelList.length > 0) {
      const gp = personelList.find((p: any) => p && Number(p.id) === gerceklestirmeGorevlisiId)
      if (gp) {
        gerceklestirmeGorevlisiAdi = gp.ad_soyad || gp.adSoyad || ''
        gerceklestirmeGorevlisiUnvan =
          gerceklestirmeGorevlisiUnvan || gp.unvan || 'Gerçekleştirme Görevlisi'
      }
    }

    let ilgiliPersonelAdi: string | undefined
    let ilgiliPersonelUnvan: string | undefined
    const ilgiliPersonelId = matchedBirim?.ilgili_personel_id
      ? Number(matchedBirim.ilgili_personel_id)
      : undefined

    if (ilgiliPersonelId && Array.isArray(personelList) && personelList.length > 0) {
      const ip = personelList.find((p: any) => p && Number(p.id) === ilgiliPersonelId)
      if (ip) {
        ilgiliPersonelAdi = ip.ad_soyad || ip.adSoyad || ''
        ilgiliPersonelUnvan = ip.unvan || ''
      }
    }

    // Birim üzerinde ilgili personel atanmamışsa birimin ilk personeli (hazırlayan) olarak bağla
    if (!ilgiliPersonelAdi && unitPersons.length > 0) {
      const worker = unitPersons.find((p: any) => p.ad_soyad !== harcamaYetkilisiAdi) || unitPersons[0]
      if (worker) {
        ilgiliPersonelAdi = worker.ad_soyad || worker.adSoyad || ''
        ilgiliPersonelUnvan = worker.unvan || ''
      }
    }

    return {
      birimId: matchedBirim?.id ?? (hasExplicitId ? Number(birimId) || birimId! : undefined),
      birimAdi: resolvedBirimAdi,
      antetEkSatir: resolvedAntetEkSatir,
      antetSatirlari,
      mudurluk: resolvedBirimAdi || resolvedAntetEkSatir,
      harcamaBirimi: resolvedBirimAdi || resolvedAntetEkSatir,
      ihtiyacYeri,
      sunulacakMakamAdi,
      harcamaYetkilisiId,
      harcamaYetkilisiAdi,
      harcamaYetkilisiUnvan,
      gerceklestirmeGorevlisiId,
      gerceklestirmeGorevlisiAdi,
      gerceklestirmeGorevlisiUnvan,
      ilgiliPersonelId,
      ilgiliPersonelAdi,
      ilgiliPersonelUnvan,
      matchedBirim,
      birimFound,
      birimPassive,
      warning
    }
  }

  /**
   * @purpose Dosyaya ait kurumsal antet, logo, birim, harcama yetkilisi ve evrak sayısını tek elden çözümler.
   * @source TANIM_Kurum, TANIM_Birim, DATA_TeminDosyasi, TANIM_Personel, settings
   * @scope dosyaId / context
   * @usedBy DocumentEngine.resolveHeaderData, previewDataLoader
   * @see packages/document-engine/src/DocumentEngine.ts
   *
   * Veri çözümleme Document Engine tarafından yürütülür.
   * Bu fonksiyon ikinci bir SQL çözümleme zinciri oluşturmamalıdır.
   */
  async resolve(
    contextOrDosyaId: DocumentHeaderContext | number,
    queryExecutor?: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<InstitutionalHeaderData> {
    return InstitutionalHeaderProvider.resolve(contextOrDosyaId, queryExecutor)
  }

  static async resolve(
    contextOrDosyaId: DocumentHeaderContext | number,
    queryExecutor?: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<InstitutionalHeaderData> {
    const dosyaId =
      typeof contextOrDosyaId === 'number'
        ? contextOrDosyaId
        : Number(contextOrDosyaId?.dosyaId || 0)
    const execQuery =
      (typeof contextOrDosyaId === 'object' && contextOrDosyaId?.queryExecutor)
        ? contextOrDosyaId.queryExecutor
        : queryExecutor

    if (this.cache.has(dosyaId)) {
      return this.cache.get(dosyaId)!
    }

    if (!execQuery) {
      throw new Error(
        `[InstitutionalHeaderProvider] Sorgu yürütücüsü (queryExecutor) bulunamadı. Lütfen context.queryExecutor veya queryExecutor parametresi sağlayınız.`
      )
    }

    const settings = this.settingsGetter ? this.settingsGetter() : {}

    // 1. Dosya ve Harcama Birimi Sorgusu
    let dosyaRow: any = null
    if (dosyaId) {
      const rows = await execQuery(
        `SELECT d.id, d.temin_no, d.evrak_sayisi, d.konu, d.butce_yili, d.tarih, d.sunulacak_makam, d.birim_id,
                d.hazirlayan_personel_id, d.talep_eden_personel_id, d.onay_personel_id, d.sunan_personel_id,
                b.birim_adi, b.antet_ek_satir, b.harcama_yetkilisi_id, b.harcama_yetkilisi_unvan
         FROM DATA_TeminDosyasi d
         LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
         WHERE d.id = ?`,
        [dosyaId]
      )
      if (rows && rows[0]) {
        dosyaRow = rows[0]
      }
    }

    // 2. Personel Çözümlemeleri (Hazırlayan, Talep Eden, Onaylayan / Harcama Yetkilisi)
    let hazirlayanPersonelAdi = ''
    let hazirlayanPersonelUnvan = ''
    let hazirlayanTelefon = ''
    let hazirlayanEposta = ''

    let talepEdenPersonelAdi = ''
    let talepEdenPersonelUnvan = ''
    let talepEdenTelefon = ''
    let talepEdenEposta = ''

    let onaylayanPersonelAdi = ''
    let onaylayanPersonelUnvan = ''

    let harcamaYetkilisiAdi = ''
    let harcamaYetkilisiUnvan = dosyaRow?.harcama_yetkilisi_unvan || 'Harcama Yetkilisi'

    const targetHazirlayanId = dosyaRow?.hazirlayan_personel_id || dosyaRow?.sunan_personel_id
    const targetTalepEdenId = dosyaRow?.talep_eden_personel_id || dosyaRow?.hazirlayan_personel_id
    const targetOnaylayanId = dosyaRow?.onay_personel_id || dosyaRow?.harcama_yetkilisi_id

    const personelIdsToFetch = Array.from(
      new Set([targetHazirlayanId, targetTalepEdenId, targetOnaylayanId].filter(Boolean))
    )

    if (personelIdsToFetch.length > 0) {
      const placeholders = personelIdsToFetch.map(() => '?').join(', ')
      const pRows = await execQuery(
        `SELECT id, ad_soyad, unvan, telefon, eposta FROM TANIM_Personel WHERE id IN (${placeholders})`,
        personelIdsToFetch
      )

      const pMap = new Map<number, any>()
      pRows.forEach((p: any) => {
        if (p.id !== undefined && p.id !== null) {
          pMap.set(Number(p.id), p)
        }
      })

      const getPersonel = (id: any) => {
        if (id && pMap.has(Number(id))) return pMap.get(Number(id))
        if (pRows.length === 1) return pRows[0]
        return null
      }

      const hazPersonel = getPersonel(targetHazirlayanId)
      if (hazPersonel) {
        hazirlayanPersonelAdi = hazPersonel.ad_soyad || ''
        hazirlayanPersonelUnvan = hazPersonel.unvan || ''
        hazirlayanTelefon = hazPersonel.telefon || ''
        hazirlayanEposta = hazPersonel.eposta || ''
      }

      const talPersonel = getPersonel(targetTalepEdenId)
      if (talPersonel) {
        talepEdenPersonelAdi = talPersonel.ad_soyad || ''
        talepEdenPersonelUnvan = talPersonel.unvan || ''
        talepEdenTelefon = talPersonel.telefon || ''
        talepEdenEposta = talPersonel.eposta || ''
      }

      const onPersonel = getPersonel(targetOnaylayanId)
      if (onPersonel) {
        onaylayanPersonelAdi = onPersonel.ad_soyad || ''
        onaylayanPersonelUnvan = onPersonel.unvan || harcamaYetkilisiUnvan
        harcamaYetkilisiAdi = onPersonel.ad_soyad || ''
        if (onPersonel.unvan) harcamaYetkilisiUnvan = onPersonel.unvan
      }
    }

    // 3. Kurum Bilgisi ve Antet Satırları
    let kurumRow: any = null
    const activeKurumId = settings.activeKurumId ? Number(settings.activeKurumId) : null
    let kurumRows: any[] = []
    if (activeKurumId) {
      try {
        kurumRows = await execQuery(
          `SELECT * FROM TANIM_Kurum WHERE id = ? LIMIT 1`,
          [activeKurumId]
        )
      } catch {
        kurumRows = []
      }
    }
    if (!kurumRows || kurumRows.length === 0) {
      try {
        kurumRows = await execQuery(
          `SELECT * FROM TANIM_Kurum WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id ASC LIMIT 1`,
          []
        )
      } catch {
        try {
          kurumRows = await execQuery(`SELECT * FROM TANIM_Kurum ORDER BY id ASC LIMIT 1`, [])
        } catch {
          kurumRows = []
        }
      }
    }
    if (kurumRows && kurumRows[0]) {
      kurumRow = kurumRows[0]
    }

    // Kurum adı: Tanımlı kurum_adi / ad / settings.institutionName önceliklidir (asla üst kurum adı veya yapay fallback öne geçmez)
    const kurumAdiText =
      kurumRow?.kurum_adi ||
      kurumRow?.ad ||
      settings.institutionName ||
      kurumRow?.ust_kurum_adi ||
      ''

    const baseLines = this.parseKurumBaseAntetLines(kurumRow, kurumAdiText)
    const effectiveBirimSatir =
      dosyaRow?.antet_ek_satir ||
      dosyaRow?.birim_adi ||
      ''
    const antetSatirlari = effectiveBirimSatir
      ? this.composeBirimAntetLines(
          baseLines,
          effectiveBirimSatir,
          dosyaRow?.antet_ek_satir,
          undefined,
          kurumAdiText
        )
      : baseLines

    const effectiveMudurluk =
      dosyaRow?.birim_adi ||
      (dosyaRow?.antet_ek_satir ? String(dosyaRow.antet_ek_satir).trim() : '') ||
      settings.departmentName ||
      ''

    const solLogo =
      kurumRow?.logo_sol ||
      kurumRow?.logo_kurum ||
      kurumRow?.logo_url ||
      settings.logoLeft ||
      settings.institutionLogo ||
      null

    const sagLogo = kurumRow?.logo_sag || settings.logoRight || null

    // 4. Dosya Evrak Sayısı Çözümlenmesi & PRESERVE (Tüm belgelere tek kaynaktan kalıcı kalıtım)
    let detsisEvrakSayisi = ''
    const currentEvrak = String(dosyaRow?.evrak_sayisi || '').replace(/^E-/i, '').trim()
    if (currentEvrak && !currentEvrak.includes('/') && /^\d+-\d+\.\d+-\d+$/.test(currentEvrak)) {
      // Dosyada zaten resmi DETSİS formatında sayı varsa doğrudan miras/kalıtım al!
      detsisEvrakSayisi = currentEvrak
    } else if (dosyaId && this.evrakSayisiResolver) {
      try {
        detsisEvrakSayisi = await this.evrakSayisiResolver(dosyaId, execQuery)
        // PRESERVE: Dosyada kayıtlı değilse veya eski/hatalı formattaysa bir kez üretip veritabanına kalıcı yaz!
        // Böylece dosyanın altındaki tüm belgeler (İhtiyaç Listesi, Lüzum Müzekkeresi vs.)
        // tek bir sabit sayıyı kullanır, asla birbirinden farklılaşmaz!
        if (detsisEvrakSayisi) {
          try {
            await execQuery(
              'UPDATE DATA_TeminDosyasi SET evrak_sayisi = ? WHERE id = ?',
              [detsisEvrakSayisi, dosyaId]
            )
            if (dosyaRow) {
              dosyaRow.evrak_sayisi = detsisEvrakSayisi
            }
          } catch (writeErr) {
            console.warn('[InstitutionalHeaderProvider] Failed to preserve evrak_sayisi in DATA_TeminDosyasi:', writeErr)
          }
        }
      } catch (err) {
        console.warn('[InstitutionalHeaderProvider] evrakSayisiResolver failed:', err)
      }
    }

    const effectiveKurumMakam = kurumRow?.sunulacak_makam_secimi === 'kurum'
      ? (kurumRow?.sunulacak_kurum_adi || kurumRow?.makam_adi || kurumRow?.kurum_adi || '')
      : (kurumRow?.makam_adi_custom || kurumRow?.makam_adi || (kurumRow?.kurum_adi ? `${kurumRow.kurum_adi} MAKAMINA` : ''))

    const dosyaMakam = dosyaRow?.sunulacak_makam ? String(dosyaRow.sunulacak_makam).trim() : ''
    const isBareKurumName = Boolean(
      dosyaMakam && (
        dosyaMakam === kurumRow?.kurum_adi ||
        dosyaMakam === kurumRow?.sunulacak_kurum_adi ||
        dosyaMakam === kurumRow?.ad ||
        dosyaMakam === settings.institutionName ||
        (kurumRow?.sunulacak_kurum_adi && dosyaMakam.toLowerCase() === String(kurumRow.sunulacak_kurum_adi).toLowerCase()) ||
        (kurumRow?.kurum_adi && dosyaMakam.toLowerCase() === String(kurumRow.kurum_adi).toLowerCase()) ||
        (kurumRow?.kurum_adi && dosyaMakam.toLowerCase().includes(String(kurumRow.kurum_adi).toLowerCase())) ||
        (kurumRow?.sunulacak_kurum_adi && dosyaMakam.toLowerCase().includes(String(kurumRow.sunulacak_kurum_adi).toLowerCase()))
      )
    )
    const effectiveSunulacakMakam = (kurumRow?.sunulacak_makam_secimi === 'makam' && isBareKurumName && effectiveKurumMakam)
      ? effectiveKurumMakam
      : (dosyaMakam || effectiveKurumMakam || '')

    const result: InstitutionalHeaderData = {
      antetSatirlari,
      kurumUst: kurumRow?.ust_kurum_adi || '',
      kurumAdi: kurumRow?.kurum_adi || kurumRow?.ad || settings.institutionName || '',
      mudurluk: effectiveMudurluk,
      solLogo,
      sagLogo,
      dosyaNo: dosyaRow?.temin_no || '',
      evrakSayisi: detsisEvrakSayisi || dosyaRow?.temin_no || '',
      butceYili: dosyaRow?.butce_yili ? Number(dosyaRow.butce_yili) : new Date().getFullYear(),
      dosyaTarihi: dosyaRow?.tarih || '',
      konu: dosyaRow?.konu || '',
      harcamaYetkilisiAdi,
      harcamaYetkilisiUnvan,
      hazirlayanPersonelAdi,
      hazirlayanPersonelUnvan,
      hazirlayanTelefon,
      hazirlayanEposta,
      talepEdenPersonelAdi,
      talepEdenPersonelUnvan,
      talepEdenTelefon,
      talepEdenEposta,
      onaylayanPersonelAdi,
      onaylayanPersonelUnvan,
      birimId: dosyaRow?.birim_id,
      sunulacakMakam: effectiveSunulacakMakam,
      sunulacakKurumAdi: kurumRow?.sunulacak_kurum_adi || kurumRow?.kurum_adi || ''
    }

    if (dosyaId) {
      this.cache.set(dosyaId, result)
    }

    return result
  }

  /**
   * Önbelleği temizler (kurum veya dosya güncellendiğinde çağrılır)
   */
  static clearCache(dosyaId?: number): void {
    if (dosyaId !== undefined) {
      this.cache.delete(dosyaId)
    } else {
      this.cache.clear()
    }
  }
}
