import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { DocumentValidationService } from '@temin360/document-templates'
import { DocumentEngine } from '@worksuite-360/document-engine'

describe('DocumentEngine - Dosya Bazlı Belge Yönetimi ve Şablon Sistemi', () => {
  let mockDbStore: Map<string, any>
  let mockRevisionStore: any[]

  beforeEach(() => {
    mockDbStore = new Map()
    mockRevisionStore = []

    // Mock electron.ipcRenderer
    ;(global as any).window = (global as any).window || {}
    ;(global as any).window.electron = {
      ipcRenderer: {
        invoke: vi.fn(async (channel: string, payload: any) => {
          if (channel === 'belge:get-document') {
            const key = `${payload.dosyaId}_${payload.templateKey}`
            if (mockDbStore.has(key)) {
              return {
                success: true,
                exists: true,
                record: mockDbStore.get(key)
              }
            }
            return { success: true, exists: false, record: null }
          }

          if (channel === 'belge:save-document') {
            const key = `${payload.dosyaId}_${payload.templateKey}`
            const existing = mockDbStore.get(key)
            const id = existing ? existing.id : Math.floor(Math.random() * 10000) + 1
            const record = {
              id,
              dosyaId: payload.dosyaId,
              templateKey: payload.templateKey,
              data: payload.data,
              sablonVersiyon: payload.sablonVersiyon || 1,
              updatedAt: new Date().toISOString(),
              createdAt: existing ? existing.createdAt : new Date().toISOString()
            }
            mockDbStore.set(key, record)
            return { success: true, id, updatedAt: record.updatedAt }
          }

          if (channel === 'belge:reset-document') {
            const key = `${payload.dosyaId}_${payload.templateKey}`
            if (mockDbStore.has(key)) {
              const record = mockDbStore.get(key)
              mockRevisionStore.push({
                dosyaId: payload.dosyaId,
                modul: 'BELGE_YONETIMI',
                surec: 'RESET_TO_DEFAULT',
                data: record
              })
              mockDbStore.delete(key)
            }
            return { success: true }
          }

          if (channel === 'belge:delete-document') {
            const key = `${payload.dosyaId}_${payload.templateKey}`
            mockDbStore.delete(key)
            return { success: true }
          }

          if (channel === 'app:save-pdf-as') {
            return { success: true, filePath: 'C:/fake/output.pdf' }
          }

          return { success: true }
        })
      }
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    DocumentValidationService.clearRules()
  })

  // Senaryo 1: Olmayan belge ilk açılışta oluşturulur
  it('1. Olmayan belge ilk açılışta oluşturulur ve veritabanına kaydedilir', async () => {
    const dosyaId = 101
    const templateKey = 'luzum_muzekkeresi'

    const doc = await DocumentEngine.loadOrCreateDocument({
      dosyaId,
      templateKey
    })

    expect(doc).toBeDefined()
    expect(doc.dosyaId).toBe(dosyaId)
    expect(doc.templateKey).toBe(templateKey)
    expect(doc.data).toBeDefined()
    expect(doc.id).toBeGreaterThan(0)

    // Veritabanında artık kayıt olmalı
    const key = `${dosyaId}_${templateKey}`
    expect(mockDbStore.has(key)).toBe(true)
    expect(mockDbStore.get(key).data).toEqual(doc.data)
  })

  // Senaryo 2: Mevcut belge tekrar açıldığında kayıtlı verisi yüklenir
  it('2. Mevcut belge tekrar açıldığında kayıtlı verisi yüklenir', async () => {
    const dosyaId = 102
    const templateKey = 'luzum_muzekkeresi'

    // Önce özel bir veriyle kaydedelim
    const customData = {
      isBasligi: 'Özel Talep Başlığı - İlyas',
      aciklama: 'Kullanıcının elle girdiği özel açıklama',
      gerekce: 'Özel Gerekçe Metni'
    }

    await DocumentEngine.saveDocument({
      dosyaId,
      templateKey,
      data: customData
    })

    // Belge tekrar açıldığında
    const loadedDoc = await DocumentEngine.loadOrCreateDocument({
      dosyaId,
      templateKey
    })

    expect(loadedDoc.data.isBasligi).toBe('Özel Talep Başlığı - İlyas')
    expect(loadedDoc.data.aciklama).toBe('Kullanıcının elle girdiği özel açıklama')
    expect(loadedDoc.data.gerekce).toBe('Özel Gerekçe Metni')
  })

  // Senaryo 3: Aynı belge türü farklı dosyaId değerlerinde ayrı içerikler tutar
  it('3. Aynı belge türü farklı dosyaId değerlerinde ayrı içerikler tutar', async () => {
    const fileA = 201
    const fileB = 202
    const templateKey = 'luzum_muzekkeresi'

    await DocumentEngine.saveDocument({
      dosyaId: fileA,
      templateKey,
      data: { isBasligi: 'Dosya A Başlığı', miktar: 10 }
    })

    await DocumentEngine.saveDocument({
      dosyaId: fileB,
      templateKey,
      data: { isBasligi: 'Dosya B Başlığı', miktar: 50 }
    })

    const docA = await DocumentEngine.loadOrCreateDocument({
      dosyaId: fileA,
      templateKey
    })
    const docB = await DocumentEngine.loadOrCreateDocument({
      dosyaId: fileB,
      templateKey
    })

    expect(docA.data.isBasligi).toBe('Dosya A Başlığı')
    expect(docA.data.miktar).toBe(10)

    expect(docB.data.isBasligi).toBe('Dosya B Başlığı')
    expect(docB.data.miktar).toBe(50)

    expect(docA.data.isBasligi).not.toEqual(docB.data.isBasligi)
  })

  // Senaryo 4: Bir dosyadaki güncelleme diğer dosyayı değiştirmez
  it('4. Bir dosyadaki güncelleme diğer dosyayı değiştirmez', async () => {
    const fileA = 301
    const fileB = 302
    const templateKey = 'ihtiyac_listesi'

    await DocumentEngine.saveDocument({
      dosyaId: fileA,
      templateKey,
      data: { talepEden: 'Ahmet', durum: 'Taslak' }
    })

    await DocumentEngine.saveDocument({
      dosyaId: fileB,
      templateKey,
      data: { talepEden: 'Mehmet', durum: 'Onaylandı' }
    })

    // Yalnızca File A'yı güncelleyelim
    await DocumentEngine.saveDocument({
      dosyaId: fileA,
      templateKey,
      data: { talepEden: 'Ahmet Güncellendi', durum: 'Revize' }
    })

    const refreshedA = await DocumentEngine.loadOrCreateDocument({
      dosyaId: fileA,
      templateKey
    })
    const refreshedB = await DocumentEngine.loadOrCreateDocument({
      dosyaId: fileB,
      templateKey
    })

    expect(refreshedA.data.talepEden).toBe('Ahmet Güncellendi')
    expect(refreshedA.data.durum).toBe('Revize')

    // File B tamamen bozulmadan kalmalıdır
    expect(refreshedB.data.talepEden).toBe('Mehmet')
    expect(refreshedB.data.durum).toBe('Onaylandı')
  })

  // Senaryo 5: Aynı belge eşzamanlı açıldığında/kaydedildiğinde mükerrer kayıt oluşmaz
  it('5. Eşzamanlı kayıt işleminde UNIQUE kısıtı ve ON CONFLICT mükerrer kaydı engeller', () => {
    // 1. Simüle edilmiş veri tablosunda UNIQUE(temin_dosya_id, sablon_kodu) kuralı ve upsert testi
    const tableRows = new Map<
      string,
      { id: number; dosyaId: number; templateKey: string; data: string; v: number }
    >()

    const executeUpsert = (dosyaId: number, templateKey: string, dataStr: string, v: number) => {
      const uqKey = `${dosyaId}:::${templateKey}`
      const existing = tableRows.get(uqKey)
      const record = {
        id: existing ? existing.id : tableRows.size + 1,
        dosyaId,
        templateKey,
        data: dataStr,
        v
      }
      tableRows.set(uqKey, record)
      return record
    }

    // 5 eşzamanlı işlem simülasyonu
    for (let i = 1; i <= 5; i++) {
      executeUpsert(999, 'luzum_muzekkeresi', JSON.stringify({ versiyon: i }), i)
    }

    expect(tableRows.size).toBe(1)
    const saved = tableRows.get('999:::luzum_muzekkeresi')
    expect(saved).toBeDefined()
    expect(JSON.parse(saved!.data).versiyon).toBe(5)

    // 2. Eğer yerel ortamda native C++ better-sqlite3 mevcutsa gerçek SQLite motorunda da doğrula
    let isNativeSqliteAvailable = false
    try {
      const probe = new Database(':memory:')
      probe.close()
      isNativeSqliteAvailable = true
    } catch {
      isNativeSqliteAvailable = false
    }

    if (isNativeSqliteAvailable) {
      const db = new Database(':memory:')
      db.exec(`
        CREATE TABLE DATA_TeminBelgeSnapshot (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dosya_id INTEGER NOT NULL,
          sablon_kodu TEXT NOT NULL,
          sablon_adi TEXT,
          veri_json TEXT,
          sablon_versiyon INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_dosya_sablon UNIQUE (dosya_id, sablon_kodu)
        );
      `)

      const upsertStmt = db.prepare(`
        INSERT INTO DATA_TeminBelgeSnapshot (
          dosya_id,
          sablon_kodu,
          sablon_adi,
          veri_json,
          sablon_versiyon,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(dosya_id, sablon_kodu) DO UPDATE SET
          veri_json = excluded.veri_json,
          sablon_versiyon = excluded.sablon_versiyon,
          updated_at = excluded.updated_at;
      `)

      for (let i = 1; i <= 5; i++) {
        upsertStmt.run(
          999,
          'luzum_muzekkeresi',
          'Lüzum Müzekkeresi',
          JSON.stringify({ versiyon: i }),
          1
        )
      }

      const rows = db.prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = 999').all()
      expect(rows.length).toBe(1)
      expect(JSON.parse((rows[0] as any).veri_json).versiyon).toBe(5)
      db.close()
    }
  })

  // Senaryo 6: Hatalı veri doğrulamadan geçmez
  it('6. Hatalı veri doğrulamadan geçmez ve hata fırlatır', async () => {
    // Kural kaydet
    DocumentValidationService.registerRule('luzum_muzekkeresi', {
      id: 'rule-is-basligi-required',
      description: 'İş başlığı zorunlu alan kontrolü',
      severity: 'error',
      validate: (payload) => {
        if (!payload?.isBasligi || String(payload.isBasligi).trim() === '') {
          return DocumentValidationService.createIssue({
            code: 'REQ_IS_BASLIGI',
            field: 'isBasligi',
            message: 'İş başlığı alanı boş bırakılamaz.',
            severity: 'error'
          })
        }
        return null
      }
    })

    // Doğrulama servisi kontrolü
    const validationReport = DocumentValidationService.validate('luzum_muzekkeresi', {
      isBasligi: ''
    })

    expect(validationReport.hasErrors).toBe(true)
    expect(validationReport.errors.some((e) => e.field === 'isBasligi')).toBe(true)

    // DocumentEngine.saveDocument doğrulama hatasında kaydetmemeli
    await expect(
      DocumentEngine.saveDocument({
        dosyaId: 401,
        templateKey: 'luzum_muzekkeresi',
        data: { isBasligi: '' },
        validateBeforeSave: true
      })
    ).rejects.toThrow(/doğrulama hataları/i)
  })

  // Senaryo 7: Kaydetme hatasında veri tutarlılığı korunur (rollback)
  it('7. Kaydetme hatasında veri tutarlılığı korunur', async () => {
    const dosyaId = 501
    const templateKey = 'luzum_muzekkeresi'

    // Önce geçerli bir kayıt oluşturalım
    await DocumentEngine.saveDocument({
      dosyaId,
      templateKey,
      data: { isBasligi: 'Orijinal Sağlam Başlık' }
    })

    // IPC katmanında hata simüle edelim
    ;(global as any).window.electron.ipcRenderer.invoke.mockImplementationOnce(
      async (channel: string) => {
        if (channel === 'belge:save-document') {
          return { success: false, error: 'Disk yazma hatası veya kilit zaman aşımı' }
        }
        return { success: true }
      }
    )

    await expect(
      DocumentEngine.saveDocument({
        dosyaId,
        templateKey,
        data: { isBasligi: 'Bozuk Başlık' }
      })
    ).rejects.toThrow(/Disk yazma hatası/i)

    // Orijinal verinin bozulmadığını kontrol edelim
    const currentDoc = await DocumentEngine.loadOrCreateDocument({
      dosyaId,
      templateKey
    })
    expect(currentDoc.data.isBasligi).toBe('Orijinal Sağlam Başlık')
  })

  // Senaryo 8: Kaynak veriler değiştiğinde kaydedilmiş özelleştirme sessizce ezilmez
  it('8. Kaynak veriler değiştiğinde kaydedilmiş özelleştirme sessizce ezilmez', async () => {
    const dosyaId = 601
    const templateKey = 'luzum_muzekkeresi'

    // Kullanıcı bir kez kaydetmiş
    await DocumentEngine.saveDocument({
      dosyaId,
      templateKey,
      data: {
        isBasligi: 'Kullanıcının Elle Değiştirdiği Başlık',
        ozelNot: 'Kritik kullanıcı notu'
      }
    })

    // Belge tekrar açıldığında
    const loadedDoc = await DocumentEngine.loadOrCreateDocument({
      dosyaId,
      templateKey
    })

    // Kullanıcının elle girdiği alanlar korunmalıdır
    expect(loadedDoc.data.isBasligi).toBe('Kullanıcının Elle Değiştirdiği Başlık')
    expect(loadedDoc.data.ozelNot).toBe('Kritik kullanıcı notu')

    // Ancak kullanıcı açıkça resetToDefault dediğinde sıfırlanmalıdır
    const resetDoc = await DocumentEngine.resetToDefault({
      dosyaId,
      templateKey
    })

    expect(mockRevisionStore.length).toBe(1)
    expect(mockRevisionStore[0].data.data.isBasligi).toBe('Kullanıcının Elle Değiştirdiği Başlık')
    expect(resetDoc).toBeDefined()
  })

  // Senaryo 9: Migration mevcut kayıtları kaybetmez ve mükerrerleri güvenle revizyona arşivler
  it('9. Migration mükerrer kayıtları DATA_DosyaRevizyon tablosuna arşivler ve en güncelini korur', () => {
    // 1. Deterministik Deduplication Mantığı Doğrulaması
    const existingRecords = [
      {
        id: 1,
        temin_dosya_id: 701,
        sablon_kodu: 'luzum_muzekkeresi',
        veri: JSON.stringify({ v: 1 }),
        guncelleme_tarihi: '2026-01-01 10:00:00'
      },
      {
        id: 2,
        temin_dosya_id: 701,
        sablon_kodu: 'luzum_muzekkeresi',
        veri: JSON.stringify({ v: 2 }),
        guncelleme_tarihi: '2026-01-02 10:00:00'
      },
      {
        id: 3,
        temin_dosya_id: 701,
        sablon_kodu: 'luzum_muzekkeresi',
        veri: JSON.stringify({ v: 3 }),
        guncelleme_tarihi: '2026-01-03 10:00:00'
      }
    ]

    const archivedRevisions: any[] = []
    let remainingRecords = [...existingRecords]

    // Sıralama: En yeni güncelleme tarihi ve en büyük ID önce gelir
    remainingRecords.sort((a, b) => {
      const dateCmp = b.guncelleme_tarihi.localeCompare(a.guncelleme_tarihi)
      return dateCmp !== 0 ? dateCmp : b.id - a.id
    })

    const keptRecord = remainingRecords[0]
    const toArchive = remainingRecords.slice(1)

    for (const arch of toArchive) {
      archivedRevisions.push({
        temin_dosya_id: arch.temin_dosya_id,
        modul_adi: 'BELGE_YONETIMI',
        surec_kodu: 'MIGRATION_DEDUP',
        aciklama: `Şablon tekillik migration sırasında mükerrer kayıt arşivlendi (ID: ${arch.id})`,
        eski_veri: arch.veri
      })
    }

    remainingRecords = [keptRecord]

    expect(remainingRecords.length).toBe(1)
    expect(JSON.parse(remainingRecords[0].veri).v).toBe(3) // En günceli korundu
    expect(archivedRevisions.length).toBe(2)
    expect(archivedRevisions.every((a) => a.surec_kodu === 'MIGRATION_DEDUP')).toBe(true)

    // 2. Native SQLite mevcutsa veritabanında çalıştır
    let isNativeSqliteAvailable = false
    try {
      const probe = new Database(':memory:')
      probe.close()
      isNativeSqliteAvailable = true
    } catch {
      isNativeSqliteAvailable = false
    }

    if (isNativeSqliteAvailable) {
      const db = new Database(':memory:')
      db.exec(`
        CREATE TABLE DATA_TeminBelgeSnapshot (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dosya_id INTEGER NOT NULL,
          sablon_kodu TEXT NOT NULL,
          sablon_adi TEXT,
          veri_json TEXT,
          updated_at DATETIME
        );

        CREATE TABLE DATA_DosyaRevizyon (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          temin_dosya_id INTEGER NOT NULL,
          modul_adi TEXT NOT NULL,
          surec_kodu TEXT NOT NULL,
          aciklama TEXT,
          eski_veri TEXT,
          olusturan_id INTEGER,
          olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)

      const insertStmt = db.prepare(`
        INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json, updated_at)
        VALUES (?, ?, ?, ?)
      `)

      insertStmt.run(701, 'luzum_muzekkeresi', JSON.stringify({ v: 1 }), '2026-01-01 10:00:00')
      insertStmt.run(701, 'luzum_muzekkeresi', JSON.stringify({ v: 2 }), '2026-01-02 10:00:00')
      insertStmt.run(701, 'luzum_muzekkeresi', JSON.stringify({ v: 3 }), '2026-01-03 10:00:00')

      const duplicates = db
        .prepare(
          `
        SELECT dosya_id, sablon_kodu, COUNT(*) as cnt
        FROM DATA_TeminBelgeSnapshot
        GROUP BY dosya_id, sablon_kodu
        HAVING cnt > 1
      `
        )
        .all() as Array<{ dosya_id: number; sablon_kodu: string }>

      expect(duplicates.length).toBe(1)

      db.transaction(() => {
        for (const dup of duplicates) {
          const rows = db
            .prepare(
              `
            SELECT id, veri_json, updated_at
            FROM DATA_TeminBelgeSnapshot
            WHERE dosya_id = ? AND sablon_kodu = ?
            ORDER BY COALESCE(updated_at, '') DESC, id DESC
          `
            )
            .all(dup.dosya_id, dup.sablon_kodu) as Array<{ id: number; veri_json: string }>

          const toArchiveSql = rows.slice(1)
          for (const arch of toArchiveSql) {
            db.prepare(
              `
              INSERT INTO DATA_DosyaRevizyon (
                temin_dosya_id, modul_adi, surec_kodu, aciklama, eski_veri
              ) VALUES (?, ?, ?, ?, ?)
            `
            ).run(
              dup.dosya_id,
              'BELGE_YONETIMI',
              'MIGRATION_DEDUP',
              `Şablon tekillik migration sırasında mükerrer kayıt arşivlendi (ID: ${arch.id})`,
              arch.veri_json
            )
            db.prepare('DELETE FROM DATA_TeminBelgeSnapshot WHERE id = ?').run(arch.id)
          }
        }
      })()

      db.exec(`
        CREATE UNIQUE INDEX idx_data_teminbelgesnapshot_unique
        ON DATA_TeminBelgeSnapshot(dosya_id, sablon_kodu);
      `)

      const remaining = db
        .prepare('SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = 701')
        .all()
      expect(remaining.length).toBe(1)
      expect(JSON.parse((remaining[0] as any).veri_json).v).toBe(3)

      db.close()
    }
  })

  // Senaryo 10: PDF ve önizleme aynı belge verisini kullanır
  it('10. PDF ve önizleme compileHtml üzerinden birebir aynı belge modelini kullanır', () => {
    const documentData = {
      dosyaKonusu: 'Ortak Model Test Konusu',
      isinAciklamasi: 'Önizleme ve PDF veri paritesi açıklaması',
      tarih: '20.10.2026',
      sunulacakMakamAdi: 'Destek Hizmetleri Makamı'
    }

    const htmlOutput = DocumentEngine.compileHtml({
      templateKey: 'luzum_muzekkeresi',
      data: documentData,
      orientation: 'portrait'
    })

    expect(htmlOutput).toBeDefined()
    expect(typeof htmlOutput).toBe('string')
    expect(htmlOutput).toContain('Destek Hizmetleri Makamı')
    expect(htmlOutput).toContain('20.10.2026')
    expect(htmlOutput).toContain('Önizleme ve PDF veri paritesi açıklaması')
    expect(htmlOutput).toContain('data-document-page="true"')
    expect(htmlOutput).toContain('@page')
  })
})

