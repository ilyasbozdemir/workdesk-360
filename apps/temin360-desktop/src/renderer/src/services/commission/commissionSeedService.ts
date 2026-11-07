/**
 * Komisyon Varsayılan Aktarımı (Seed) ve Yaşam Döngüsü Servisi
 * Aşama 7.1.3.1 Mimari Standartları
 */

export interface SeedCommissionOptions {
  mode?: 'initial' | 'missing_only' | 'replace'
  force?: boolean
}

export interface SeedCommissionResult {
  success: boolean
  skipped?: boolean
  reason?: 'already_seeded' | 'deliberately_cleared' | 'legacy_dossier' | 'no_default_members'
  seededCount?: number
  error?: string
}

export type DossierCommissionLifecycleStatus =
  | 'new_unseeded' // Yeni dosya, henüz aktarım yapılmadı (komisyon_seed_edildi === 0)
  | 'seeded' // Kurumsal varsayılanlar başarıyla aktarıldı (komisyon_seed_edildi === 1)
  | 'deliberately_empty' // Kullanıcı bilerek tüm üyeleri sildi (komisyon_seed_edildi === 2)
  | 'legacy_file' // Geçmişten gelen eski dosya (komisyon_seed_edildi IS NULL)

/**
 * Dosyanın komisyon yaşam döngüsü durumunu sorgular
 */
export async function getDossierCommissionStatus(
  dosyaId: number
): Promise<{ status: DossierCommissionLifecycleStatus; memberCount: number }> {
  try {
    const dosyaRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      'SELECT id, komisyon_seed_edildi FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1',
      [dosyaId]
    )
    const dosya = dosyaRes?.data?.[0]
    if (!dosya) {
      return { status: 'legacy_file', memberCount: 0 }
    }

    const countRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      'SELECT COUNT(*) as cnt FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
      [dosyaId]
    )
    const memberCount = countRes?.data?.[0]?.cnt || 0

    const seedState = dosya.komisyon_seed_edildi

    if (seedState === 1) {
      return { status: 'seeded', memberCount }
    }
    if (seedState === 2) {
      return { status: 'deliberately_empty', memberCount }
    }
    if (seedState === 0) {
      return { status: 'new_unseeded', memberCount }
    }
    return { status: 'legacy_file', memberCount }
  } catch (err) {
    console.error('getDossierCommissionStatus error:', err)
    return { status: 'legacy_file', memberCount: 0 }
  }
}

/**
 * Kullanıcı dosyadaki tüm üyeleri bilerek sildiğinde dosya durumunu 'bilinçli boş' olarak işaretler
 */
export async function markDossierAsDeliberatelyCleared(dosyaId: number): Promise<boolean> {
  try {
    const res = await (window as any).electron.ipcRenderer.invoke(
      'db:run',
      'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 2 WHERE id = ?',
      [dosyaId]
    )
    return Boolean(res?.success)
  } catch (err) {
    console.error('markDossierAsDeliberatelyCleared error:', err)
    return false
  }
}

export interface RawCommissionMember {
  id?: number
  temin_dosya_id?: number
  komisyon_id?: number
  personel_id?: number
  ad_soyad?: string
  unvan?: string | null
  gorev?: string | null
  gorev_adi?: string | null
  rol?: string | null
  komisyon_turu?: string | null
  komisyon_adi?: string | null
  belgede_goster?: number | boolean | null
  vekalet_unvani?: string | null
  baslangic_tarihi?: string | null
  bitis_tarihi?: string | null
  belge_kapsami?: string | null
  hedef_belgeler?: string | null
  asli_yedek?: string | null
  asil_mi?: number
  imza_turu?: string | null
  birim_id?: number | null
  birim?: string | null
  sira?: number
  kaynak?: string | null
}

/**
 * Bir önceki dosyadaki komisyon üyelerini tespit eder
 * Kullanıcının açtığı doğrudan temin veya ilgili ihale dosyası için en son atanmış komisyonu bulur.
 */
export interface LastDossierCommissionData {
  dosyaId: number
  dosyaNo: string
  members: RawCommissionMember[]
}

export async function getLastDossierCommissions(
  currentDosyaId?: number | null
): Promise<LastDossierCommissionData | null> {
  try {
    let ihaleSekli: string | null = null
    if (currentDosyaId) {
      const curRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT ihale_sekli, tur FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1',
        [currentDosyaId]
      )
      if (curRes?.success && curRes.data?.[0]) {
        ihaleSekli = curRes.data[0].ihale_sekli || null
      }
    }

    const findSql = `
      SELECT DISTINCT d.id, COALESCE(d.temin_no, '#' || d.id) as dosya_no
      FROM DATA_TeminKomisyon tk
      JOIN DATA_TeminDosyasi d ON tk.temin_dosya_id = d.id
      WHERE tk.temin_dosya_id != ? AND COALESCE(d.is_deleted, 0) = 0
      ORDER BY 
        CASE WHEN ? IS NOT NULL AND d.ihale_sekli = ? THEN 0 ELSE 1 END,
        tk.temin_dosya_id DESC
      LIMIT 1
    `
    const findRes = await window.electron.ipcRenderer.invoke('db:query', findSql, [
      currentDosyaId || 0,
      ihaleSekli,
      ihaleSekli
    ])

    if (!findRes?.success || !findRes.data?.[0]) {
      // Eğer hiçbir dosyada özel komisyon kaydı yoksa kurumsal şablon üyelerine yedeklen
      const defRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        `SELECT u.*, p.ad_soyad, p.unvan, g.ad as gorev_adi, k.ad as komisyon_adi, k.tur as komisyon_tur_kodu
         FROM TANIM_KomisyonUye u
         JOIN TANIM_Personel p ON u.personel_id = p.id
         LEFT JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
         LEFT JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
         WHERE u.personel_id IS NOT NULL
         ORDER BY u.komisyon_id ASC, u.sira ASC`
      )
      if (defRes?.success && Array.isArray(defRes.data) && defRes.data.length > 0) {
        return {
          dosyaId: 0,
          dosyaNo: 'Kurumsal Şablon',
          members: defRes.data.map((m: any) => ({
            komisyon_id: m.komisyon_id,
            personel_id: m.personel_id,
            ad_soyad: m.ad_soyad,
            unvan: m.unvan,
            gorev: m.gorev_adi || 'Üye',
            gorev_adi: m.gorev_adi || 'Üye',
            komisyon_turu: m.komisyon_adi || (m.komisyon_id === 2 ? 'Muayene ve Kabul Komisyonu' : 'Yaklaşık Maliyet Komisyonu'),
            belgede_goster: m.belgede_goster !== 0 ? 1 : 0,
            asil_mi: m.asil_mi
          }))
        }
      }
      return null
    }

    const prevDosya = findRes.data[0]
    const membersRes = await window.electron.ipcRenderer.invoke(
      'db:query',
      'SELECT * FROM DATA_TeminKomisyon WHERE temin_dosya_id = ? ORDER BY id ASC',
      [prevDosya.id]
    )

    if (!membersRes?.success || !Array.isArray(membersRes.data) || membersRes.data.length === 0) {
      return null
    }

    return {
      dosyaId: prevDosya.id,
      dosyaNo: prevDosya.dosya_no,
      members: membersRes.data as RawCommissionMember[]
    }
  } catch (err) {
    console.warn('getLastDossierCommissions error:', err)
    return null
  }
}

/**
 * Kurumsal veya bir önceki dosyadaki komisyon üyelerini dosyaya kontrollü ve atomik olarak aktarır.
 *
 * Güvenceler:
 * 1. Tekil 'db:transaction' içinde çalışır; kısmi hata durumunda otomatik rollback yapılır.
 * 2. Idempotent çalışır; aynı üyeler mükerrer eklenmez.
 * 3. Öncelik sırası: Bir önceki dosyanın kadrosu -> Kurumsal şablon tanımları.
 */
export async function seedDossierCommission(
  dosyaId: number,
  options: SeedCommissionOptions = {}
): Promise<SeedCommissionResult> {
  const { mode = 'initial', force = false } = options

  try {
    if (!dosyaId || isNaN(dosyaId)) {
      return { success: false, error: 'Geçersiz dosya ID' }
    }

    // 1. Dosya kaydını oku
    const dosyaRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      'SELECT id, komisyon_seed_edildi FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1',
      [dosyaId]
    )
    const dosya = dosyaRes?.data?.[0]
    if (!dosya) {
      return { success: false, error: 'Dosya bulunamadı' }
    }

    const seedState = dosya.komisyon_seed_edildi

    // Kontroller (force değilse)
    if (!force) {
      if (seedState === 1) {
        return { success: true, skipped: true, reason: 'already_seeded' }
      }
      if (seedState === 2) {
        return { success: true, skipped: true, reason: 'deliberately_cleared' }
      }
      if (seedState === null || seedState === undefined) {
        // Eski dosya: Kullanıcı açık işlem yapmadan otomatik seed edilmez
        return { success: true, skipped: true, reason: 'legacy_dossier' }
      }
    }

    // 2. ÖNCELİK 1: Bir önceki dosyanın komisyon kadrosunu kontrol et
    const prevCommissionData = await getLastDossierCommissions(dosyaId)

    let candidateMembers: any[] = []
    let sourceOrigin: 'onceki_dosya' | 'kurumsal' = 'kurumsal'

    if (prevCommissionData && prevCommissionData.dosyaId > 0 && prevCommissionData.members.length > 0) {
      candidateMembers = prevCommissionData.members
      sourceOrigin = 'onceki_dosya'
    } else {
      // ÖNCELİK 2: Kurumsal komisyon tanımlarını ve üyelerini çek
      const defRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        `SELECT u.*, p.ad_soyad, p.unvan, g.ad as gorev_adi, k.ad as komisyon_adi, k.tur as komisyon_tur_kodu
         FROM TANIM_KomisyonUye u
         JOIN TANIM_Personel p ON u.personel_id = p.id
         JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
         JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
         WHERE u.personel_id IS NOT NULL
         ORDER BY u.komisyon_id ASC, u.sira ASC`
      )

      if (defRes?.success && Array.isArray(defRes.data) && defRes.data.length > 0) {
        candidateMembers = defRes.data
        sourceOrigin = 'kurumsal'
      }
    }

    if (candidateMembers.length === 0) {
      // Ne önceki dosya ne de kurumsal üye tanımlanmamışsa dosyayı aktarılmış işaretle
      await (window as any).electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
        [dosyaId]
      )
      return { success: true, skipped: true, reason: 'no_default_members', seededCount: 0 }
    }

    // 3. Mevcut dosya üyelerini al (Mükerrerlik engeli)
    let existingMemberSet = new Set<string>()
    if (mode !== 'replace') {
      const existingRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT komisyon_id, personel_id FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
        [dosyaId]
      )
      if (existingRes?.success && Array.isArray(existingRes.data)) {
        existingRes.data.forEach((r: any) => {
          existingMemberSet.add(`${r.komisyon_id}_${r.personel_id}`)
        })
      }
    }

    // 4. Atomik Transaction listesi hazırla
    const txStatements: { sql: string; params: any[] }[] = []

    if (mode === 'replace') {
      txStatements.push({
        sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
        params: [dosyaId]
      })
    }

    let insertCount = 0

    if (sourceOrigin === 'onceki_dosya') {
      // Bir önceki dosyadaki DATA_TeminKomisyon kayıtlarını yeni dosyaya klonla
      for (const m of candidateMembers) {
        const key = `${m.komisyon_id}_${m.personel_id}`
        if (mode !== 'replace' && existingMemberSet.has(key)) {
          continue
        }

        txStatements.push({
          sql: `INSERT INTO DATA_TeminKomisyon 
                (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, vekalet_unvani, baslangic_tarihi, bitis_tarihi, belge_kapsami, hedef_belgeler, asli_yedek, imza_turu, birim_id, birim, kaynak)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'onceki_dosya')`,
          params: [
            dosyaId,
            m.komisyon_id || 1,
            m.personel_id,
            m.ad_soyad,
            m.unvan || null,
            m.gorev || 'Üye',
            m.rol || 'Üye',
            m.komisyon_turu || 'Komisyon',
            m.belgede_goster !== undefined ? m.belgede_goster : 1,
            m.vekalet_unvani || null,
            m.baslangic_tarihi || null,
            m.bitis_tarihi || null,
            m.belge_kapsami || 'tumu',
            m.hedef_belgeler || '["*"]',
            m.asli_yedek || 'Asil',
            m.imza_turu || 'İmza',
            m.birim_id || null,
            m.birim || null
          ]
        })
        insertCount++
      }
    } else {
      // Kurumsal şablon üyelerini aktar
      for (const m of candidateMembers) {
        const key = `${m.komisyon_id}_${m.personel_id}`
        if (mode !== 'replace' && existingMemberSet.has(key)) {
          continue
        }

        const rol =
          m.asil_mi === 0
            ? 'Yedek Üye'
            : m.gorev_adi?.toLowerCase().includes('başkan') ||
                m.gorev_adi?.toLowerCase().includes('baskan')
              ? 'Başkan'
              : 'Üye'

        const isShow = m.belgede_goster !== 0 && m.belgede_goster !== false ? 1 : 0
        const scope = m.belge_kapsami || 'tumu'
        const hedefJson = m.hedef_belgeler || '["*"]'

        txStatements.push({
          sql: `INSERT INTO DATA_TeminKomisyon 
                (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, belge_kapsami, hedef_belgeler, asli_yedek, imza_turu, birim_id, birim, kaynak)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'kurumsal')`,
          params: [
            dosyaId,
            m.komisyon_id,
            m.personel_id,
            m.ad_soyad,
            m.unvan || null,
            m.gorev_adi || 'Üye',
            rol,
            m.komisyon_adi || 'Komisyon',
            isShow,
            scope,
            hedefJson,
            m.asil_mi === 1 ? 'Asil' : 'Yedek',
            m.imza_turu || 'İmza',
            m.birim_id || null,
            m.birim || null
          ]
        })
        insertCount++
      }
    }

    // Dosya bayrağını da aynı transaction içinde '1' yap
    txStatements.push({
      sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
      params: [dosyaId]
    })

    // 5. Tek seferde atomik çalıştır
    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Transaction başarısız oldu')
    }

    return { success: true, seededCount: insertCount }
  } catch (err: any) {
    console.error('seedDossierCommission error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Belirli bir kaynak dosyanın komisyon kadrosunu hedef dosyaya atomik olarak kopyalar.
 * Kaynak dosyada özel atama yoksa (kurumsal şablon mirası kullanıyorsa) otomatik olarak
 * kurumsal şablon (TANIM_KomisyonUye) veya en son atanmış dosya kadrosuna yedeklenir (fallback).
 */
export async function copyCommissionBetweenDossiers(
  targetDosyaId: number,
  sourceDosyaId: number
): Promise<{ success: boolean; error?: string; count?: number; fisNo?: string }> {
  try {
    if (!targetDosyaId || !sourceDosyaId || targetDosyaId === sourceDosyaId) {
      return { success: false, error: 'Geçersiz hedef veya kaynak dosya' }
    }

    const sourceRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      'SELECT * FROM DATA_TeminKomisyon WHERE temin_dosya_id = ? ORDER BY id ASC',
      [sourceDosyaId]
    )

    let membersToCopy: any[] =
      sourceRes?.success && Array.isArray(sourceRes.data) ? sourceRes.data : []
    let fallbackOrigin: 'dosya' | 'kurumsal_sablon' | 'son_dosya' = 'dosya'

    // Kaynak dosyada henüz özel DATA_TeminKomisyon satırı yoksa (UI'da Kurumsal Şablon mirası olarak görünüyorsa)
    // Kurumsal şablonu (TANIM_KomisyonUye) çekerek kopyala:
    if (membersToCopy.length === 0) {
      const defRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        `SELECT u.*, p.ad_soyad, p.unvan, g.ad as gorev_adi, k.ad as komisyon_adi, k.tur as komisyon_tur_kodu
         FROM TANIM_KomisyonUye u
         JOIN TANIM_Personel p ON u.personel_id = p.id
         LEFT JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
         LEFT JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
         WHERE u.personel_id IS NOT NULL
         ORDER BY u.komisyon_id ASC, u.sira ASC`
      )
      if (defRes?.success && Array.isArray(defRes.data) && defRes.data.length > 0) {
        fallbackOrigin = 'kurumsal_sablon'
        membersToCopy = defRes.data.map((m: any) => {
          const gorev = m.gorev_adi || m.gorev || 'Üye'
          const rol =
            m.asil_mi === 0
              ? 'Yedek Üye'
              : gorev.toLowerCase().includes('başkan') || gorev.toLowerCase().includes('baskan')
                ? 'Başkan'
                : 'Üye'
          return {
            komisyon_id: m.komisyon_id || 1,
            personel_id: m.personel_id,
            ad_soyad: m.ad_soyad,
            unvan: m.unvan || null,
            gorev,
            rol,
            komisyon_turu: m.komisyon_adi || (m.komisyon_id === 2 ? 'Muayene ve Kabul Komisyonu' : 'Yaklaşık Maliyet Komisyonu'),
            belgede_goster: m.belgede_goster !== 0 && m.belgede_goster !== false ? 1 : 0,
            belge_kapsami: m.belge_kapsami || 'tumu',
            hedef_belgeler: m.hedef_belgeler || '["*"]',
            asli_yedek: m.asil_mi === 0 ? 'Yedek' : 'Asil'
          }
        })
      }
    }

    // Hâlâ boşsa sistemdeki en son komisyon atanmış dosyadan yedekle
    if (membersToCopy.length === 0) {
      const lastData = await getLastDossierCommissions(targetDosyaId)
      if (lastData && lastData.members.length > 0) {
        fallbackOrigin = 'son_dosya'
        membersToCopy = lastData.members
      }
    }

    if (membersToCopy.length === 0) {
      return {
        success: false,
        error:
          'Kaynak dosyada veya kurumsal şablon havuzunda kopyalanacak komisyon üyesi bulunamadı. Lütfen önce Kurumsal Şablon Havuzundan veya dosya içinden üye tanımlayın.'
      }
    }

    const sourceDosyaRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      "SELECT COALESCE(dosya_no, temin_no, '#' || id) as dosya_no FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1",
      [sourceDosyaId]
    )
    const sourceDosyaNo = sourceDosyaRes?.data?.[0]?.dosya_no || `#${sourceDosyaId}`
    const fisNo = `FIS-${Date.now().toString().slice(-6)}`

    const txStatements: { sql: string; params: any[] }[] = []

    // 1. Hedef dosyanın mevcut komisyonlarını temizle
    txStatements.push({
      sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
      params: [targetDosyaId]
    })

    // 2. Kaynaktaki üyeleri ekle
    const snapshotMembers: any[] = []
    for (const m of membersToCopy) {
      const gorev = m.gorev || m.gorev_adi || 'Üye'
      const rol =
        m.rol ||
        (gorev.toLowerCase().includes('başkan') || gorev.toLowerCase().includes('baskan')
          ? 'Başkan'
          : 'Üye')
      const komTuru =
        m.komisyon_turu ||
        m.komisyon_adi ||
        (Number(m.komisyon_id) === 2 ? 'Muayene ve Kabul Komisyonu' : 'Yaklaşık Maliyet Komisyonu')
      const asliYedek = m.asli_yedek || (m.asil_mi === 0 ? 'Yedek' : 'Asil')

      txStatements.push({
        sql: `INSERT INTO DATA_TeminKomisyon 
              (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, vekalet_unvani, baslangic_tarihi, bitis_tarihi, belge_kapsami, hedef_belgeler, asli_yedek, imza_turu, birim_id, birim, kaynak)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          targetDosyaId,
          m.komisyon_id || (komTuru.toLowerCase().includes('muayene') ? 2 : 1),
          m.personel_id || m.personelId || null,
          m.ad_soyad || m.personel_ad_soyad || '',
          m.unvan || m.personel_unvan || null,
          gorev,
          rol,
          komTuru,
          m.belgede_goster !== undefined ? (m.belgede_goster ? 1 : 0) : 1,
          m.vekalet_unvani || null,
          m.baslangic_tarihi || null,
          m.bitis_tarihi || null,
          m.belge_kapsami || 'tumu',
          typeof m.hedef_belgeler === 'string'
            ? m.hedef_belgeler
            : JSON.stringify(m.hedef_belgeler || ['*']),
          asliYedek,
          m.imza_turu || m.imzaTuru || 'İmza',
          m.birim_id || null,
          m.birim || null,
          `kopyalandi:${sourceDosyaId}`
        ]
      })

      snapshotMembers.push({
        fisNo,
        komisyon_id: m.komisyon_id || (komTuru.toLowerCase().includes('muayene') ? 2 : 1),
        personelId: m.personel_id || m.personelId || null,
        personel_id: m.personel_id || m.personelId || null,
        ad_soyad: m.ad_soyad || m.personel_ad_soyad || '',
        personel_ad_soyad: m.ad_soyad || m.personel_ad_soyad || '',
        unvan: m.unvan || m.personel_unvan || '',
        gorev,
        gorev_adi: gorev,
        rol,
        asil_mi: asliYedek === 'Yedek' ? 0 : 1,
        asli_yedek: asliYedek,
        imza_turu: m.imza_turu || m.imzaTuru || 'İmza',
        imzaTuru: m.imza_turu || m.imzaTuru || 'İmza',
        birim_id: m.birim_id || null,
        birim: m.birim || null,
        komisyon_turu: komTuru
      })
    }

    // 3. Dosyayı tohumlandı işaretle
    txStatements.push({
      sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
      params: [targetDosyaId]
    })

    // 4. Revizyon Geçmişi (Fiş) Snapshot'ı ekle
    const islemLabel =
      fallbackOrigin === 'kurumsal_sablon'
        ? `[${fisNo}] Kadro Kopyalandı (${sourceDosyaNo} • Şablon Kadrosu)`
        : `[${fisNo}] Kadro Kopyalandı (${sourceDosyaNo} no'lu dosyadan)`

    txStatements.push({
      sql: `INSERT INTO DATA_TeminKomisyonHistory (temin_dosya_id, komisyon_turu, islem_turu, islem_yapan, snapshot_data) VALUES (?, ?, ?, ?, ?)`,
      params: [
        targetDosyaId,
        'Genel Kadro',
        islemLabel,
        'Kullanıcı',
        JSON.stringify(snapshotMembers)
      ]
    })

    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Transaction başarısız oldu')
    }

    return { success: true, count: membersToCopy.length, fisNo }
  } catch (err: any) {
    console.error('copyCommissionBetweenDossiers error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Kurumsal Genel Şablon üyelerini (TANIM_KomisyonUye) hedef dosyaya aktarır.
 */
export async function applyInstitutionalTemplateToDossier(
  targetDosyaId: number
): Promise<{ success: boolean; error?: string; count?: number; fisNo?: string }> {
  try {
    if (!targetDosyaId) {
      return { success: false, error: 'Geçersiz hedef dosya' }
    }

    const defRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      `SELECT u.*, p.ad_soyad, p.unvan, g.ad as gorev_adi, k.ad as komisyon_adi, k.tur as komisyon_tur_kodu
       FROM TANIM_KomisyonUye u
       JOIN TANIM_Personel p ON u.personel_id = p.id
       LEFT JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
       LEFT JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
       WHERE u.personel_id IS NOT NULL
       ORDER BY u.komisyon_id ASC, u.sira ASC`
    )

    if (!defRes?.success || !Array.isArray(defRes.data) || defRes.data.length === 0) {
      return { success: false, error: 'Kurumsal şablonda tanımlı komisyon üyesi bulunamadı' }
    }

    const fisNo = `FIS-${Date.now().toString().slice(-6)}`
    const txStatements: { sql: string; params: any[] }[] = []

    // 1. Hedef dosyanın mevcut komisyonlarını temizle
    txStatements.push({
      sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
      params: [targetDosyaId]
    })

    const snapshotMembers: any[] = []
    for (const m of defRes.data) {
      const gorevAdi = m.gorev_adi || 'Üye'
      const rol =
        m.asil_mi === 0
          ? 'Yedek Üye'
          : gorevAdi.toLowerCase().includes('başkan') || gorevAdi.toLowerCase().includes('baskan')
            ? 'Başkan'
            : 'Üye'

      const isShow = m.belgede_goster !== 0 && m.belgede_goster !== false ? 1 : 0
      const scope = m.belge_kapsami || 'tumu'
      const hedefJson = m.hedef_belgeler || '["*"]'
      const komAdi =
        m.komisyon_adi ||
        (Number(m.komisyon_id) === 2 ? 'Muayene ve Kabul Komisyonu' : 'Yaklaşık Maliyet Komisyonu')

      txStatements.push({
        sql: `INSERT INTO DATA_TeminKomisyon 
              (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, belge_kapsami, hedef_belgeler, asli_yedek, imza_turu, birim_id, birim, kaynak)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'kurumsal')`,
        params: [
          targetDosyaId,
          m.komisyon_id,
          m.personel_id,
          m.ad_soyad,
          m.unvan || null,
          gorevAdi,
          rol,
          komAdi,
          isShow,
          scope,
          hedefJson,
          m.asil_mi === 1 ? 'Asil' : 'Yedek',
          m.imza_turu || 'İmza',
          m.birim_id || null,
          m.birim || null
        ]
      })

      snapshotMembers.push({
        fisNo,
        komisyon_id: m.komisyon_id,
        personelId: m.personel_id,
        personel_id: m.personel_id,
        ad_soyad: m.ad_soyad,
        personel_ad_soyad: m.ad_soyad,
        unvan: m.unvan,
        gorev: gorevAdi,
        gorev_adi: gorevAdi,
        rol,
        asil_mi: m.asil_mi === 1 ? 1 : 0,
        asli_yedek: m.asil_mi === 1 ? 'Asil' : 'Yedek',
        imza_turu: m.imza_turu || 'İmza',
        imzaTuru: m.imza_turu || 'İmza',
        birim_id: m.birim_id || null,
        birim: m.birim || null,
        komisyon_turu: komAdi
      })
    }

    // 2. Dosya bayrağını güncelle
    txStatements.push({
      sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
      params: [targetDosyaId]
    })

    // 3. Snapshot (Fiş) ekle
    txStatements.push({
      sql: `INSERT INTO DATA_TeminKomisyonHistory (temin_dosya_id, komisyon_turu, islem_turu, islem_yapan, snapshot_data) VALUES (?, ?, ?, ?, ?)`,
      params: [
        targetDosyaId,
        'Genel Kadro',
        `[${fisNo}] Kurumsal Genel Şablondan Aktarıldı`,
        'Kullanıcı',
        JSON.stringify(snapshotMembers)
      ]
    })

    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Transaction başarısız oldu')
    }

    return { success: true, count: defRes.data.length, fisNo }
  } catch (err: any) {
    console.error('applyInstitutionalTemplateToDossier error:', err)
    return { success: false, error: err.message }
  }
}

export interface BulkApplyCommissionOptions {
  /** Kaynak dosya ID'si. Verilmezse kurumsal şablon (TANIM_KomisyonUye) veya customMembers kullanılır */
  sourceDosyaId?: number | null
  /** Fişten (History snapshot) veya özel listeden doğrudan aktarım için */
  customMembers?: any[]
  /** Sadece boş/şablon olanlara mı yoksa tüm dosyalara mı uygulanacağı (varsayılan: 'all') */
  targetScope?: 'all' | 'empty_or_template'
  /** Fiş açıklaması / işlem türü */
  islemAciklama?: string
}

export interface BulkApplyCommissionResult {
  success: boolean
  affectedDossiersCount?: number
  memberCountPerDossier?: number
  fisNo?: string
  error?: string
}

/**
 * Tek tıkla komisyon üyelerini (Kurumsal Şablon, Seçili Kaynak Dosya veya Fiş Kadrosu)
 * sistemdeki TÜM aktif dosyalara atomik olarak uygular ve Fiş kaydı oluşturur.
 */
export async function applyCommissionToAllDossiers(
  options: BulkApplyCommissionOptions = {}
): Promise<BulkApplyCommissionResult> {
  try {
    const { sourceDosyaId, customMembers, targetScope = 'all', islemAciklama } = options

    // 1. Uygulanacak kaynak kadroyu çözümle
    let resolvedMembers: any[] = []
    let sourceLabel = 'Kurumsal Şablon'

    if (Array.isArray(customMembers) && customMembers.length > 0) {
      resolvedMembers = customMembers
      sourceLabel = islemAciklama || 'Seçili Fiş Kadrosu'
    } else if (sourceDosyaId) {
      const srcDosyaRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        "SELECT COALESCE(dosya_no, temin_no, '#' || id) as dosya_no FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1",
        [sourceDosyaId]
      )
      const srcNo = srcDosyaRes?.data?.[0]?.dosya_no || `#${sourceDosyaId}`
      sourceLabel = `${srcNo} Dosya Kadrosu`

      const srcMembersRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM DATA_TeminKomisyon WHERE temin_dosya_id = ? ORDER BY id ASC',
        [sourceDosyaId]
      )
      if (
        srcMembersRes?.success &&
        Array.isArray(srcMembersRes.data) &&
        srcMembersRes.data.length > 0
      ) {
        resolvedMembers = srcMembersRes.data
      }
    }

    // Eğer hala boşsa Kurumsal Şablon (TANIM_KomisyonUye) üzerinden al
    if (resolvedMembers.length === 0) {
      const defRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        `SELECT u.*, p.ad_soyad, p.unvan, g.ad as gorev_adi, k.ad as komisyon_adi, k.tur as komisyon_tur_kodu
         FROM TANIM_KomisyonUye u
         JOIN TANIM_Personel p ON u.personel_id = p.id
         LEFT JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
         LEFT JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
         WHERE u.personel_id IS NOT NULL
         ORDER BY u.komisyon_id ASC, u.sira ASC`
      )
      if (defRes?.success && Array.isArray(defRes.data) && defRes.data.length > 0) {
        resolvedMembers = defRes.data
      }
    }

    // Hala boşsa en son komisyon atanmış dosyadan al
    if (resolvedMembers.length === 0) {
      const lastData = await getLastDossierCommissions(null)
      if (lastData && lastData.members.length > 0) {
        resolvedMembers = lastData.members
        sourceLabel = `${lastData.dosyaNo} Dosya Kadrosu`
      }
    }

    if (resolvedMembers.length === 0) {
      return {
        success: false,
        error:
          'Tüm dosyalara uygulanacak komisyon üyesi bulunamadı. Lütfen önce Kurumsal Şablon Havuzundan veya bir dosyadan komisyon görevlilerini tanımlayın.'
      }
    }

    // 2. Hedef dosyaları çek
    const dosyalarRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      targetScope === 'empty_or_template'
        ? `SELECT d.id, COALESCE(d.dosya_no, d.temin_no, '#' || d.id) as dosya_no
           FROM DATA_TeminDosyasi d
           WHERE COALESCE(d.is_deleted, 0) = 0
             AND NOT EXISTS (SELECT 1 FROM DATA_TeminKomisyon tk WHERE tk.temin_dosya_id = d.id)
           ORDER BY d.id DESC`
        : `SELECT d.id, COALESCE(d.dosya_no, d.temin_no, '#' || d.id) as dosya_no
           FROM DATA_TeminDosyasi d
           WHERE COALESCE(d.is_deleted, 0) = 0
           ORDER BY d.id DESC`
    )

    const targetDosyalar: { id: number; dosya_no: string }[] =
      dosyalarRes?.success && Array.isArray(dosyalarRes.data) ? dosyalarRes.data : []

    if (targetDosyalar.length === 0) {
      return {
        success: false,
        error: 'Kadro uygulanacak aktif temin dosyası bulunamadı.'
      }
    }

    const fisNo = `FIS-${Date.now().toString().slice(-6)}`
    const txStatements: { sql: string; params: any[] }[] = []

    // Normalize edilmiş üyeleri hazırla
    const normalizedMembers = resolvedMembers.map((m: any) => {
      const gorev = m.gorev || m.gorev_adi || 'Üye'
      const rol =
        m.rol ||
        (m.asil_mi === 0 || m.asli_yedek === 'Yedek'
          ? 'Yedek Üye'
          : gorev.toLowerCase().includes('başkan') || gorev.toLowerCase().includes('baskan')
            ? 'Başkan'
            : 'Üye')
      const komTuru =
        m.komisyon_turu ||
        m.komisyon_adi ||
        (Number(m.komisyon_id) === 2 ? 'Muayene ve Kabul Komisyonu' : 'Yaklaşık Maliyet Komisyonu')
      const komId =
        m.komisyon_id ||
        (komTuru.toLowerCase().includes('muayene') || komTuru.toLowerCase().includes('kabul')
          ? 2
          : 1)
      const asliYedek = m.asli_yedek || (m.asil_mi === 0 ? 'Yedek' : 'Asil')
      const adSoyad = m.ad_soyad || m.personel_ad_soyad || ''
      const personelId = m.personel_id || m.personelId || null
      const unvan = m.unvan || m.personel_unvan || null
      const isShow = m.belgede_goster !== 0 && m.belgede_goster !== false ? 1 : 0

      return {
        komisyon_id: komId,
        personel_id: personelId,
        ad_soyad: adSoyad,
        unvan,
        gorev,
        rol,
        komisyon_turu: komTuru,
        belgede_goster: isShow,
        vekalet_unvani: m.vekalet_unvani || null,
        baslangic_tarihi: m.baslangic_tarihi || null,
        bitis_tarihi: m.bitis_tarihi || null,
        belge_kapsami: m.belge_kapsami || 'tumu',
        hedef_belgeler:
          typeof m.hedef_belgeler === 'string'
            ? m.hedef_belgeler
            : JSON.stringify(m.hedef_belgeler || ['*']),
        asli_yedek: asliYedek,
        imza_turu: m.imza_turu || m.imzaTuru || 'İmza',
        birim_id: m.birim_id || null,
        birim: m.birim || null
      }
    })

    const snapshotMembers = normalizedMembers.map((m) => ({
      fisNo,
      komisyon_id: m.komisyon_id,
      personelId: m.personel_id,
      personel_id: m.personel_id,
      ad_soyad: m.ad_soyad,
      personel_ad_soyad: m.ad_soyad,
      unvan: m.unvan || '',
      gorev: m.gorev,
      gorev_adi: m.gorev,
      rol: m.rol,
      asil_mi: m.asli_yedek === 'Yedek' ? 0 : 1,
      asli_yedek: m.asli_yedek,
      imza_turu: m.imza_turu,
      imzaTuru: m.imza_turu,
      birim_id: m.birim_id,
      birim: m.birim,
      komisyon_turu: m.komisyon_turu
    }))

    const historyTitle = `[${fisNo}] Toplu Kadro Aktarımı (${sourceLabel} → ${targetDosyalar.length} Dosya)`

    for (const d of targetDosyalar) {
      txStatements.push({
        sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
        params: [d.id]
      })

      for (const m of normalizedMembers) {
        txStatements.push({
          sql: `INSERT INTO DATA_TeminKomisyon 
                (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, vekalet_unvani, baslangic_tarihi, bitis_tarihi, belge_kapsami, hedef_belgeler, asli_yedek, imza_turu, birim_id, birim, kaynak)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            d.id,
            m.komisyon_id,
            m.personel_id,
            m.ad_soyad,
            m.unvan,
            m.gorev,
            m.rol,
            m.komisyon_turu,
            m.belgede_goster,
            m.vekalet_unvani,
            m.baslangic_tarihi,
            m.bitis_tarihi,
            m.belge_kapsami,
            m.hedef_belgeler,
            m.asli_yedek,
            m.imza_turu,
            m.birim_id,
            m.birim,
            `toplu_fis:${fisNo}`
          ]
        })
      }

      txStatements.push({
        sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
        params: [d.id]
      })

      txStatements.push({
        sql: `INSERT INTO DATA_TeminKomisyonHistory (temin_dosya_id, komisyon_turu, islem_turu, islem_yapan, snapshot_data) VALUES (?, ?, ?, ?, ?)`,
        params: [
          d.id,
          'Genel Kadro',
          historyTitle,
          'Kullanıcı',
          JSON.stringify(snapshotMembers)
        ]
      })
    }

    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Toplu aktarım transaction hatası')
    }

    return {
      success: true,
      affectedDossiersCount: targetDosyalar.length,
      memberCountPerDossier: normalizedMembers.length,
      fisNo
    }
  } catch (err: any) {
    console.error('applyCommissionToAllDossiers error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Geçmişteki bir Komisyon Fişini (DATA_TeminKomisyonHistory) kendi dosyasına geri yükler
 * veya tek tıkla tüm dosyalara uygular.
 */
export async function restoreCommissionFromHistoryFis(
  historyId: number,
  mode: 'single' | 'all' = 'single',
  targetDosyaIdOverride?: number
): Promise<{
  success: boolean
  error?: string
  fisNo?: string
  affectedDossiersCount?: number
  count?: number
}> {
  try {
    const histRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      'SELECT * FROM DATA_TeminKomisyonHistory WHERE id = ? LIMIT 1',
      [historyId]
    )
    const histRow = histRes?.data?.[0]
    if (!histRow) {
      return { success: false, error: 'İlgili komisyon fişi bulunamadı' }
    }

    let parsedSnapshot: any[] = []
    try {
      parsedSnapshot = JSON.parse(histRow.snapshot_data || '[]')
    } catch {
      parsedSnapshot = []
    }

    if (!Array.isArray(parsedSnapshot) || parsedSnapshot.length === 0) {
      return { success: false, error: 'Bu fişte geri yüklenecek üye verisi bulunamadı' }
    }

    // Fişteki komisyon_turu bilgisini üyelere miras ver (eğer tekil sekme kaydıysa)
    const enrichedMembers = parsedSnapshot.map((m: any) => ({
      ...m,
      komisyon_turu: m.komisyon_turu || histRow.komisyon_turu || 'Genel Kadro'
    }))

    if (mode === 'all') {
      return await applyCommissionToAllDossiers({
        customMembers: enrichedMembers,
        islemAciklama: `Fiş #${String(historyId).padStart(4, '0')} Kadrosu`
      })
    }

    const targetDosyaId = targetDosyaIdOverride || histRow.temin_dosya_id
    if (!targetDosyaId) {
      return { success: false, error: 'Hedef dosya ID bulunamadı' }
    }

    const fisNo = `FIS-${Date.now().toString().slice(-6)}`
    const txStatements: { sql: string; params: any[] }[] = []

    const histKomTuru = String(histRow.komisyon_turu || '').toLowerCase()
    const isPartialMaliyet =
      histKomTuru.includes('maliyet') || histKomTuru.includes('fiyat') || histKomTuru.includes('piyasa')
    const isPartialMuayene =
      histKomTuru.includes('muayene') || histKomTuru.includes('kabul')

    if (isPartialMaliyet && !isPartialMuayene) {
      txStatements.push({
        sql: `DELETE FROM DATA_TeminKomisyon 
              WHERE temin_dosya_id = ? 
              AND (komisyon_id = 1 OR LOWER(komisyon_turu) LIKE '%maliyet%' OR LOWER(komisyon_turu) LIKE '%fiyat%')`,
        params: [targetDosyaId]
      })
    } else if (isPartialMuayene && !isPartialMaliyet) {
      txStatements.push({
        sql: `DELETE FROM DATA_TeminKomisyon 
              WHERE temin_dosya_id = ? 
              AND (komisyon_id = 2 OR LOWER(komisyon_turu) LIKE '%muayene%' OR LOWER(komisyon_turu) LIKE '%kabul%')`,
        params: [targetDosyaId]
      })
    } else {
      txStatements.push({
        sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
        params: [targetDosyaId]
      })
    }

    const snapshotMembers: any[] = []
    for (const m of enrichedMembers) {
      const gorev = m.gorev || m.gorev_adi || 'Üye'
      const rol =
        m.rol ||
        (m.asil_mi === 0 || m.asli_yedek === 'Yedek'
          ? 'Yedek Üye'
          : gorev.toLowerCase().includes('başkan') || gorev.toLowerCase().includes('baskan')
            ? 'Başkan'
            : 'Üye')
      const komTuru =
        m.komisyon_turu && m.komisyon_turu !== 'Genel Kadro'
          ? m.komisyon_turu
          : Number(m.komisyon_id) === 2
            ? 'Muayene ve Kabul Komisyonu'
            : 'Yaklaşık Maliyet Komisyonu'
      const komId =
        m.komisyon_id ||
        (komTuru.toLowerCase().includes('muayene') || komTuru.toLowerCase().includes('kabul')
          ? 2
          : 1)
      const asliYedek = m.asli_yedek || (m.asil_mi === 0 ? 'Yedek' : 'Asil')
      const adSoyad = m.ad_soyad || m.personel_ad_soyad || ''
      const personelId = m.personel_id || m.personelId || null
      const unvan = m.unvan || m.personel_unvan || null

      txStatements.push({
        sql: `INSERT INTO DATA_TeminKomisyon 
              (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, vekalet_unvani, baslangic_tarihi, bitis_tarihi, belge_kapsami, hedef_belgeler, asli_yedek, imza_turu, birim_id, birim, kaynak)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          targetDosyaId,
          komId,
          personelId,
          adSoyad,
          unvan,
          gorev,
          rol,
          komTuru,
          m.belgede_goster !== 0 && m.belgede_goster !== false ? 1 : 0,
          m.vekalet_unvani || null,
          m.baslangic_tarihi || null,
          m.bitis_tarihi || null,
          m.belge_kapsami || 'tumu',
          typeof m.hedef_belgeler === 'string'
            ? m.hedef_belgeler
            : JSON.stringify(m.hedef_belgeler || ['*']),
          asliYedek,
          m.imza_turu || m.imzaTuru || 'İmza',
          m.birim_id || null,
          m.birim || null,
          `fis_geri_yukleme:${historyId}`
        ]
      })

      snapshotMembers.push({
        fisNo,
        komisyon_id: komId,
        personelId,
        personel_id: personelId,
        ad_soyad: adSoyad,
        personel_ad_soyad: adSoyad,
        unvan: unvan || '',
        gorev,
        gorev_adi: gorev,
        rol,
        asil_mi: asliYedek === 'Yedek' ? 0 : 1,
        asli_yedek: asliYedek,
        imza_turu: m.imza_turu || m.imzaTuru || 'İmza',
        imzaTuru: m.imza_turu || m.imzaTuru || 'İmza',
        birim_id: m.birim_id || null,
        birim: m.birim || null,
        komisyon_turu: komTuru
      })
    }

    txStatements.push({
      sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
      params: [targetDosyaId]
    })

    txStatements.push({
      sql: `INSERT INTO DATA_TeminKomisyonHistory (temin_dosya_id, komisyon_turu, islem_turu, islem_yapan, snapshot_data) VALUES (?, ?, ?, ?, ?)`,
      params: [
        targetDosyaId,
        histRow.komisyon_turu || 'Genel Kadro',
        `[${fisNo}] Fiş #${String(historyId).padStart(4, '0')} Kadrosundan Geri Yüklendi`,
        'Kullanıcı',
        JSON.stringify(snapshotMembers)
      ]
    })

    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Fiş geri yükleme transaction hatası')
    }

    return {
      success: true,
      fisNo,
      affectedDossiersCount: 1,
      count: snapshotMembers.length
    }
  } catch (err: any) {
    console.error('restoreCommissionFromHistoryFis error:', err)
    return { success: false, error: err.message }
  }
}
