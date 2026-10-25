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

    if (prevCommissionData && prevCommissionData.members.length > 0) {
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
                (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, vekalet_unvani, baslangic_tarihi, bitis_tarihi, belge_kapsami, hedef_belgeler, asli_yedek, kaynak)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'onceki_dosya')`,
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
            m.asli_yedek || 'Asil'
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
                (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, belge_kapsami, hedef_belgeler, asli_yedek, kaynak)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'kurumsal')`,
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
            m.asil_mi === 1 ? 'Asil' : 'Yedek'
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
 */
export async function copyCommissionBetweenDossiers(
  targetDosyaId: number,
  sourceDosyaId: number
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    if (!targetDosyaId || !sourceDosyaId || targetDosyaId === sourceDosyaId) {
      return { success: false, error: 'Geçersiz hedef veya kaynak dosya' }
    }

    const sourceRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      'SELECT * FROM DATA_TeminKomisyon WHERE temin_dosya_id = ? ORDER BY id ASC',
      [sourceDosyaId]
    )
    if (!sourceRes?.success || !Array.isArray(sourceRes.data) || sourceRes.data.length === 0) {
      return { success: false, error: 'Kaynak dosyada kopyalanacak komisyon üyesi bulunamadı' }
    }

    const sourceDosyaRes = await (window as any).electron.ipcRenderer.invoke(
      'db:query',
      "SELECT COALESCE(dosya_no, temin_no, '#' || id) as dosya_no FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1",
      [sourceDosyaId]
    )
    const sourceDosyaNo = sourceDosyaRes?.data?.[0]?.dosya_no || `#${sourceDosyaId}`

    const txStatements: { sql: string; params: any[] }[] = []

    // 1. Hedef dosyanın mevcut komisyonlarını temizle
    txStatements.push({
      sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
      params: [targetDosyaId]
    })

    // 2. Kaynaktaki üyeleri ekle
    const snapshotMembers: any[] = []
    for (const m of sourceRes.data) {
      txStatements.push({
        sql: `INSERT INTO DATA_TeminKomisyon 
              (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, vekalet_unvani, baslangic_tarihi, bitis_tarihi, belge_kapsami, hedef_belgeler, asli_yedek, kaynak)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          targetDosyaId,
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
          `kopyalandi:${sourceDosyaId}`
        ]
      })

      snapshotMembers.push({
        personelId: m.personel_id,
        ad_soyad: m.ad_soyad,
        unvan: m.unvan,
        gorev: m.gorev,
        rol: m.rol,
        asli_yedek: m.asli_yedek,
        komisyon_turu: m.komisyon_turu
      })
    }

    // 3. Dosyayı tohumlandı işaretle
    txStatements.push({
      sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
      params: [targetDosyaId]
    })

    // 4. Revizyon Geçmişi Snapshot'ı ekle
    txStatements.push({
      sql: `INSERT INTO DATA_TeminKomisyonHistory (temin_dosya_id, komisyon_turu, islem_turu, islem_yapan, snapshot_data) VALUES (?, ?, ?, ?, ?)`,
      params: [
        targetDosyaId,
        'Genel Kadro',
        `Kadro Kopyalandı (${sourceDosyaNo} no'lu dosyadan)`,
        'Kullanıcı',
        JSON.stringify(snapshotMembers)
      ]
    })

    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Transaction başarısız oldu')
    }

    return { success: true, count: sourceRes.data.length }
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
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    if (!targetDosyaId) {
      return { success: false, error: 'Geçersiz hedef dosya' }
    }

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

    if (!defRes?.success || !Array.isArray(defRes.data) || defRes.data.length === 0) {
      return { success: false, error: 'Kurumsal şablonda tanımlı komisyon üyesi bulunamadı' }
    }

    const txStatements: { sql: string; params: any[] }[] = []

    // 1. Hedef dosyanın mevcut komisyonlarını temizle
    txStatements.push({
      sql: 'DELETE FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
      params: [targetDosyaId]
    })

    const snapshotMembers: any[] = []
    for (const m of defRes.data) {
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
              (temin_dosya_id, komisyon_id, personel_id, ad_soyad, unvan, gorev, rol, komisyon_turu, belgede_goster, belge_kapsami, hedef_belgeler, asli_yedek, kaynak)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'kurumsal')`,
        params: [
          targetDosyaId,
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
          m.asil_mi === 1 ? 'Asil' : 'Yedek'
        ]
      })

      snapshotMembers.push({
        personelId: m.personel_id,
        ad_soyad: m.ad_soyad,
        unvan: m.unvan,
        gorev: m.gorev_adi,
        rol,
        asli_yedek: m.asil_mi === 1 ? 'Asil' : 'Yedek',
        komisyon_turu: m.komisyon_adi
      })
    }

    // 2. Dosya bayrağını güncelle
    txStatements.push({
      sql: 'UPDATE DATA_TeminDosyasi SET komisyon_seed_edildi = 1 WHERE id = ?',
      params: [targetDosyaId]
    })

    // 3. Snapshot ekle
    txStatements.push({
      sql: `INSERT INTO DATA_TeminKomisyonHistory (temin_dosya_id, komisyon_turu, islem_turu, islem_yapan, snapshot_data) VALUES (?, ?, ?, ?, ?)`,
      params: [
        targetDosyaId,
        'Genel Kadro',
        'Kurumsal Genel Şablondan Aktarıldı',
        'Kullanıcı',
        JSON.stringify(snapshotMembers)
      ]
    })

    const txRes = await (window as any).electron.ipcRenderer.invoke('db:transaction', txStatements)
    if (!txRes?.success) {
      throw new Error(txRes?.error || 'Transaction başarısız oldu')
    }

    return { success: true, count: defRes.data.length }
  } catch (err: any) {
    console.error('applyInstitutionalTemplateToDossier error:', err)
    return { success: false, error: err.message }
  }
}
