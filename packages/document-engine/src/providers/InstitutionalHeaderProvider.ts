import { InstitutionalHeaderData } from '../types/contracts'

export interface InstitutionalHeaderSettings {
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
  matchedBirim: Record<string, any> | null
  birimFound: boolean
  birimPassive: boolean
  warning?: string
}

/**
 * Kurumsal ve Antet Bilgileri Sağlayıcısı (Institutional Header Provider)
 * - Belgeye özel alanlar, kalemler veya tekliflerle ilgilenmez.
 * - Sadece kurum, birim ve dosya üst verilerini çözümler.
 * - Oturum içi önbellekleme yaparak gereksiz tekrar eden sorguları önler.
 */
export class InstitutionalHeaderProvider {
  private static cache = new Map<number, InstitutionalHeaderData>()
  private static settingsGetter: (() => InstitutionalHeaderSettings) | null = null
  private static evrakSayisiResolver: EvrakSayisiResolverFn | null = null

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
        }
      } catch {
        if (typeof kurumRow.kurum_anteti === 'string' && kurumRow.kurum_anteti.trim()) {
          lines = kurumRow.kurum_anteti
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean)
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
   * Temel kurum antet satırları ile seçili birimin antet_ek_satir / birim_adi bilgisini
   * mükerrer satır oluşturmadan birleştirir.
   */
  static composeBirimAntetLines(
    baseLines: string[],
    birimOrEkSatir?: Record<string, any> | string | null,
    dosyaAntetEkSatir?: string | null,
     knownBirimNames?: string[]
  ): string[] {
    const cleanBase = Array.isArray(baseLines)
      ? baseLines.map((s) => String(s ?? '').trim()).filter(Boolean)
      : []

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
    if (dosyaAntetEkSatir && String(dosyaAntetEkSatir).trim()) {
      ekSatir = String(dosyaAntetEkSatir).trim()
    } else if (typeof birimOrEkSatir === 'string') {
      ekSatir = birimOrEkSatir.trim()
    } else if (birimOrEkSatir && typeof birimOrEkSatir === 'object') {
      ekSatir = String(
        birimOrEkSatir.antet_ek_satir ||
          birimOrEkSatir.birim_antet_ek_satir ||
          ''
      ).trim()
    }

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

    const resolvedBirimAdi =
      matchedBirim?.birim_adi ||
      matchedBirim?.ad ||
      cleanBirimAdi ||
      ''
    const resolvedAntetEkSatir =
      (dosyaAntetEkSatir && String(dosyaAntetEkSatir).trim()) ||
      (matchedBirim?.antet_ek_satir && String(matchedBirim.antet_ek_satir).trim()) ||
      ''

    const antetSatirlari = resolvedAntetEkSatir
      ? this.composeBirimAntetLines(
          effectiveBaseLines,
          resolvedAntetEkSatir,
          dosyaAntetEkSatir,
          knownBirimNames
        )
      : effectiveBaseLines

    const sunulacakMakamAdi = String(
      matchedBirim?.sunum_makami ||
        kurumRow?.makam_adi ||
        ''
    ).trim()

    const ihtiyacYeri = String(
      matchedBirim?.ihtiyac_yeri_eki ||
        resolvedBirimAdi ||
        ''
    ).trim()

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
      matchedBirim,
      birimFound,
      birimPassive,
      warning
    }
  }

  /**
   * Belirtilen dosya için kurumsal antet ve başlık verilerini çözümler.
   */
  static async resolve(
    dosyaId: number,
    queryExecutor: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<InstitutionalHeaderData> {
    if (this.cache.has(dosyaId)) {
      return this.cache.get(dosyaId)!
    }

    const settings = this.settingsGetter ? this.settingsGetter() : {}

    // 1. Dosya ve Harcama Birimi Sorgusu
    let dosyaRow: any = null
    if (dosyaId) {
      const rows = await queryExecutor(
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
      const pRows = await queryExecutor(
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
    const kurumRows = await queryExecutor(
      `SELECT * FROM TANIM_Kurum ORDER BY is_active DESC, id ASC LIMIT 1`,
      []
    )
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
    const antetSatirlari = dosyaRow?.antet_ek_satir
      ? this.composeBirimAntetLines(
          baseLines,
          dosyaRow.antet_ek_satir,
          dosyaRow.antet_ek_satir
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
        detsisEvrakSayisi = await this.evrakSayisiResolver(dosyaId, queryExecutor)
        // PRESERVE: Dosyada kayıtlı değilse veya eski/hatalı formattaysa bir kez üretip veritabanına kalıcı yaz!
        // Böylece dosyanın altındaki tüm belgeler (İhtiyaç Listesi, Lüzum Müzekkeresi vs.)
        // tek bir sabit sayıyı kullanır, asla birbirinden farklılaşmaz!
        if (detsisEvrakSayisi) {
          try {
            await queryExecutor(
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
      sunulacakMakam: dosyaRow?.sunulacak_makam || ''
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
