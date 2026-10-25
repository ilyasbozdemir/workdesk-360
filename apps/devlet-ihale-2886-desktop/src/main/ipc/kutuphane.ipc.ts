/* eslint-disable */
import { ipcMain } from 'electron'
import { workspaceManager } from '../database/workspace'

/**
 * Belgelerim Kütüphanesi IPC Servis Katmanı
 * Gruplar, belgeler, değişmez sürümler, çöp kutusu ve yer tutucu anahtar yönetimi
 */
export function registerKutuphaneIpc(): void {
  const getDb = () => workspaceManager.getDb()
  // -------------------------------------------------------------
  // 1. GRUP / KLASÖR İŞLEMLERİ
  // -------------------------------------------------------------
  ipcMain.handle('kutuphane:grup:list', async () => {
    try {
      const db = getDb()
      const rows = db.prepare('SELECT * FROM DATA_KutuphaneGrup ORDER BY sira ASC, ad ASC').all()
      return { success: true, data: rows }
    } catch (err: any) {
      console.error('[Kutuphane IPC] grup:list error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:grup:save', async (_event, payload: any) => {
    try {
      const db = getDb()
      const { id, parent_id, ad, renk, ikon, sira } = payload

      if (id) {
        db.prepare(
          `UPDATE DATA_KutuphaneGrup 
           SET parent_id = ?, ad = ?, renk = ?, ikon = ?, sira = ?
           WHERE id = ?`
        ).run(parent_id || null, ad, renk || 'blue', ikon || 'Folder', sira || 0, id)
        return { success: true, id }
      } else {
        const info = db
          .prepare(
            `INSERT INTO DATA_KutuphaneGrup (parent_id, ad, renk, ikon, sira)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(parent_id || null, ad, renk || 'blue', ikon || 'Folder', sira || 0)
        return { success: true, id: info.lastInsertRowid }
      }
    } catch (err: any) {
      console.error('[Kutuphane IPC] grup:save error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:grup:delete', async (_event, id: number) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM DATA_KutuphaneGrup WHERE id = ?').run(id)
      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] grup:delete error:', err)
      return { success: false, error: err.message }
    }
  })

  // -------------------------------------------------------------
  // 2. BELGE VE SÜRÜM İŞLEMLERİ
  // -------------------------------------------------------------
  ipcMain.handle('kutuphane:belge:list', async (_event, filters: any = {}) => {
    try {
      const db = getDb()
      const { grup_id, cop_kutusu, arsiv_mi, favori_mi, q } = filters

      let query = `
        SELECT b.*, 
               s.surum_no as aktif_surum_no,
               s.etiket as aktif_surum_etiket,
               s.icerik_html as aktif_icerik_html,
               s.created_at as son_guncelleme_at
        FROM DATA_KutuphaneBelge b
        LEFT JOIN DATA_KutuphaneBelgeSurum s ON b.aktif_surum_id = s.id
        WHERE 1=1
      `
      const params: any[] = []

      if (cop_kutusu) {
        query += ' AND b.silindi_at IS NOT NULL'
      } else {
        query += ' AND b.silindi_at IS NULL'

        if (grup_id !== undefined && grup_id !== null) {
          query += ' AND b.grup_id = ?'
          params.push(grup_id)
        }
        if (arsiv_mi !== undefined) {
          query += ' AND b.arsiv_mi = ?'
          params.push(arsiv_mi ? 1 : 0)
        }
        if (favori_mi !== undefined) {
          query += ' AND b.favori_mi = ?'
          params.push(favori_mi ? 1 : 0)
        }
      }

      if (q && String(q).trim() !== '') {
        query += ' AND (b.ad LIKE ? OR s.icerik_html LIKE ?)'
        const searchPattern = `%${String(q).trim()}%`
        params.push(searchPattern, searchPattern)
      }

      query += ' ORDER BY b.id DESC'

      const rows = db.prepare(query).all(...params)
      return { success: true, data: rows }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:list error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:get', async (_event, belgeId: number) => {
    try {
      const db = getDb()
      const belge = db.prepare('SELECT * FROM DATA_KutuphaneBelge WHERE id = ?').get(belgeId)

      if (!belge) {
        return { success: false, error: 'Belge bulunamadı' }
      }

      // Sürümleri al
      const surumler = db
        .prepare('SELECT * FROM DATA_KutuphaneBelgeSurum WHERE belge_id = ? ORDER BY surum_no DESC')
        .all(belgeId)

      return { success: true, data: { belge, surumler } }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:get error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:create', async (_event, payload: any) => {
    try {
      const db = getDb()
      const { grup_id, ad, etiketler = [], icerik_html = '', kosullar_json = '[]' } = payload

      const result = db.transaction(() => {
        // 1. Belge kaydı aç
        const belgeInfo = db
          .prepare(
            `INSERT INTO DATA_KutuphaneBelge (grup_id, ad, etiketler, arsiv_mi, favori_mi)
             VALUES (?, ?, ?, 0, 0)`
          )
          .run(grup_id || null, ad, JSON.stringify(etiketler))
        const belgeId = Number(belgeInfo.lastInsertRowid)

        // 2. İlk sürümü (v1) oluştur
        const surumInfo = db
          .prepare(
            `INSERT INTO DATA_KutuphaneBelgeSurum (belge_id, surum_no, etiket, "not", icerik_html, kosullar_json)
             VALUES (?, 1, 'v1.0', 'İlk Sürüm', ?, ?)`
          )
          .run(
            belgeId,
            icerik_html,
            typeof kosullar_json === 'string' ? kosullar_json : JSON.stringify(kosullar_json)
          )
        const surumId = Number(surumInfo.lastInsertRowid)

        // 3. Aktif sürümü güncelle
        db.prepare('UPDATE DATA_KutuphaneBelge SET aktif_surum_id = ? WHERE id = ?').run(
          surumId,
          belgeId
        )

        return { belgeId, surumId }
      })()

      return { success: true, data: result }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:create error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:saveRevision', async (_event, payload: any) => {
    try {
      const db = getDb()
      const { belge_id, etiket, not, icerik_html, kosullar_json = '[]' } = payload

      const result = db.transaction(() => {
        // Mevcut en büyük sürüm numarasını bul
        const lastSurum = db
          .prepare(
            'SELECT COALESCE(MAX(surum_no), 0) as max_no FROM DATA_KutuphaneBelgeSurum WHERE belge_id = ?'
          )
          .get(belge_id)
        const nextSurumNo = Number(lastSurum?.max_no || 0) + 1

        // Yeni sürüm kaydet (Eski sürüm değişmez, append-only)
        const surumInfo = db
          .prepare(
            `INSERT INTO DATA_KutuphaneBelgeSurum (belge_id, surum_no, etiket, "not", icerik_html, kosullar_json)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            belge_id,
            nextSurumNo,
            etiket || `v${nextSurumNo}.0`,
            not || 'Düzenleme',
            icerik_html,
            typeof kosullar_json === 'string' ? kosullar_json : JSON.stringify(kosullar_json)
          )
        const newSurumId = Number(surumInfo.lastInsertRowid)

        // Belgenin aktif sürümünü yeni sürüme bağla
        db.prepare('UPDATE DATA_KutuphaneBelge SET aktif_surum_id = ? WHERE id = ?').run(
          newSurumId,
          belge_id
        )

        return { belgeId: belge_id, surumId: newSurumId, surumNo: nextSurumNo }
      })()

      return { success: true, data: result }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:saveRevision error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:updateMeta', async (_event, payload: any) => {
    try {
      const db = getDb()
      const { id, ad, grup_id, etiketler, arsiv_mi, favori_mi, aktif_surum_id } = payload

      const updates: string[] = []
      const params: any[] = []

      if (ad !== undefined) {
        updates.push('ad = ?')
        params.push(ad)
      }
      if (grup_id !== undefined) {
        updates.push('grup_id = ?')
        params.push(grup_id || null)
      }
      if (etiketler !== undefined) {
        updates.push('etiketler = ?')
        params.push(typeof etiketler === 'string' ? etiketler : JSON.stringify(etiketler))
      }
      if (arsiv_mi !== undefined) {
        updates.push('arsiv_mi = ?')
        params.push(arsiv_mi ? 1 : 0)
      }
      if (favori_mi !== undefined) {
        updates.push('favori_mi = ?')
        params.push(favori_mi ? 1 : 0)
      }
      if (aktif_surum_id !== undefined) {
        updates.push('aktif_surum_id = ?')
        params.push(aktif_surum_id)
      }

      if (updates.length > 0) {
        params.push(id)
        db.prepare(`UPDATE DATA_KutuphaneBelge SET ${updates.join(', ')} WHERE id = ?`).run(
          ...params
        )
      }

      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:updateMeta error:', err)
      return { success: false, error: err.message }
    }
  })

  // Çöp Kutusu (Soft Delete - 30 gün kuralı)
  ipcMain.handle('kutuphane:belge:trash', async (_event, id: number) => {
    try {
      const db = getDb()
      db.prepare('UPDATE DATA_KutuphaneBelge SET silindi_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        id
      )
      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:trash error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:restore', async (_event, id: number) => {
    try {
      const db = getDb()
      db.prepare('UPDATE DATA_KutuphaneBelge SET silindi_at = NULL WHERE id = ?').run(id)
      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:restore error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:permanentDelete', async (_event, id: number) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM DATA_KutuphaneBelge WHERE id = ?').run(id)
      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:permanentDelete error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:belge:purgeExpired', async () => {
    try {
      const db = getDb()
      // 30 günü aşan çöp kutusu belgelerini temizle
      const info = db
        .prepare(
          "DELETE FROM DATA_KutuphaneBelge WHERE silindi_at IS NOT NULL AND silindi_at <= datetime('now', '-30 days')"
        )
        .run()
      return { success: true, count: info.changes }
    } catch (err: any) {
      console.error('[Kutuphane IPC] belge:purgeExpired error:', err)
      return { success: false, error: err.message }
    }
  })

  // -------------------------------------------------------------
  // 3. YER TUTUCU İŞLEMLERİ & GÜVENLİ YENİDEN ADLANDIRMA
  // -------------------------------------------------------------
  ipcMain.handle('kutuphane:yertutucu:list', async (_event, filters: any = {}) => {
    try {
      const db = getDb()
      const { kapsam, kapsam_id } = filters

      let query = 'SELECT * FROM DATA_KutuphaneYerTutucu WHERE 1=1'
      const params: any[] = []

      if (kapsam) {
        query += ' AND kapsam = ?'
        params.push(kapsam)
      }
      if (kapsam_id !== undefined) {
        if (kapsam_id === null) {
          query += ' AND kapsam_id IS NULL'
        } else {
          query += ' AND kapsam_id = ?'
          params.push(kapsam_id)
        }
      }

      query += ' ORDER BY sira ASC, etiket ASC'

      const rows = db.prepare(query).all(...params)
      return { success: true, data: rows }
    } catch (err: any) {
      console.error('[Kutuphane IPC] yertutucu:list error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:yertutucu:save', async (_event, payload: any) => {
    try {
      const db = getDb()
      const {
        id,
        kapsam,
        kapsam_id,
        anahtar,
        etiket,
        tip,
        varsayilan,
        secenekler_json,
        kaynak,
        sira
      } = payload

      if (id) {
        db.prepare(
          `UPDATE DATA_KutuphaneYerTutucu 
           SET etiket = ?, tip = ?, varsayilan = ?, secenekler_json = ?, kaynak = ?, sira = ?
           WHERE id = ?`
        ).run(
          etiket,
          tip || 'metin',
          varsayilan || null,
          secenekler_json || null,
          kaynak || 'elle',
          sira || 0,
          id
        )
        return { success: true, id }
      } else {
        const info = db
          .prepare(
            `INSERT INTO DATA_KutuphaneYerTutucu 
             (kapsam, kapsam_id, anahtar, etiket, tip, varsayilan, secenekler_json, kaynak, sira)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            kapsam || 'genel',
            kapsam_id || null,
            anahtar,
            etiket,
            tip || 'metin',
            varsayilan || null,
            secenekler_json || null,
            kaynak || 'elle',
            sira || 0
          )
        return { success: true, id: info.lastInsertRowid }
      }
    } catch (err: any) {
      console.error('[Kutuphane IPC] yertutucu:save error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('kutuphane:yertutucu:delete', async (_event, id: number) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM DATA_KutuphaneYerTutucu WHERE id = ?').run(id)
      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] yertutucu:delete error:', err)
      return { success: false, error: err.message }
    }
  })

  /**
   * Bir yer tutucu anahtarının geçtiği belgeleri tespit eder
   */
  ipcMain.handle('kutuphane:yertutucu:findUsages', async (_event, anahtar: string) => {
    try {
      const db = getDb()
      const searchTarget = `data-ph="${anahtar}"`
      const searchTargetSingle = `data-ph='${anahtar}'`

      const rows = db
        .prepare(
          `
        SELECT DISTINCT b.id, b.ad, s.surum_no
        FROM DATA_KutuphaneBelge b
        JOIN DATA_KutuphaneBelgeSurum s ON b.aktif_surum_id = s.id
        WHERE b.silindi_at IS NULL 
          AND (s.icerik_html LIKE ? OR s.icerik_html LIKE ?)
      `
        )
        .all(`%${searchTarget}%`, `%${searchTargetSingle}%`)

      return { success: true, data: rows }
    } catch (err: any) {
      console.error('[Kutuphane IPC] yertutucu:findUsages error:', err)
      return { success: false, error: err.message }
    }
  })

  /**
   * Güvenli Anahtar Yeniden Adlandırma Akışı:
   * 1. Yer tutucu tablosundaki anahtarı günceller
   * 2. Seçili belgelerin aktif sürümlerinde data-ph="eski" -> data-ph="yeni" değiştirip yeni revizyon üretir
   */
  ipcMain.handle('kutuphane:yertutucu:renameKey', async (_event, payload: any) => {
    try {
      const db = getDb()
      const { yerTutucuId, eskiAnahtar, yeniAnahtar, belgeIds = [] } = payload

      db.transaction(() => {
        // 1. Yer tutucuyu güncelle
        if (yerTutucuId) {
          db.prepare('UPDATE DATA_KutuphaneYerTutucu SET anahtar = ? WHERE id = ?').run(
            yeniAnahtar,
            yerTutucuId
          )
        } else {
          db.prepare('UPDATE DATA_KutuphaneYerTutucu SET anahtar = ? WHERE anahtar = ?').run(
            yeniAnahtar,
            eskiAnahtar
          )
        }

        // 2. Belgelerdeki işaretleri güncelle ve yeni sürüm oluştur
        for (const bId of belgeIds) {
          const belge = db
            .prepare(
              `SELECT b.id, s.icerik_html, s.surum_no, s.kosullar_json
               FROM DATA_KutuphaneBelge b
               JOIN DATA_KutuphaneBelgeSurum s ON b.aktif_surum_id = s.id
               WHERE b.id = ?`
            )
            .get(bId)

          if (belge && belge.icerik_html) {
            const regex = new RegExp(`data-ph=["']${eskiAnahtar}["']`, 'g')
            const updatedHtml = belge.icerik_html.replace(regex, `data-ph="${yeniAnahtar}"`)

            if (updatedHtml !== belge.icerik_html) {
              const nextNo = Number(belge.surum_no || 1) + 1
              const sInfo = db
                .prepare(
                  `INSERT INTO DATA_KutuphaneBelgeSurum (belge_id, surum_no, etiket, "not", icerik_html, kosullar_json)
                   VALUES (?, ?, ?, ?, ?, ?)`
                )
                .run(
                  bId,
                  nextNo,
                  `v${nextNo}.0`,
                  `Yer tutucu anahtarı güncellendi (${eskiAnahtar} -> ${yeniAnahtar})`,
                  updatedHtml,
                  belge.kosullar_json || '[]'
                )
              db.prepare('UPDATE DATA_KutuphaneBelge SET aktif_surum_id = ? WHERE id = ?').run(
                sInfo.lastInsertRowid,
                bId
              )
            }
          }
        }
      })()

      return { success: true }
    } catch (err: any) {
      console.error('[Kutuphane IPC] yertutucu:renameKey error:', err)
      return { success: false, error: err.message }
    }
  })

  // -------------------------------------------------------------
  // 5. FAZ 5: DOSYA ENTEGRASYONU & ŞABLONA YAYINLAMA
  // -------------------------------------------------------------

  /**
   * Belgeyi doğrudan temin dosyasına ek belge olarak bağlama ve dondurma (DATA_DosyaRevizyon)
   */
  ipcMain.handle('kutuphane:dosyaya-bagla', async (_event, payload: any) => {
    try {
      const db = getDb()
      const {
        dosyaId,
        belgeId,
        surumNo,
        baslik,
        dondurulmusHtml,
        doldurulanDegerler = {},
        olusturan = 'Sistem Kullanıcısı'
      } = payload

      if (!dosyaId || !belgeId) {
        throw new Error('dosyaId ve belgeId zorunludur')
      }

      const belgeKodu = `kutuphane_belge_${belgeId}`
      const versiyon = `v${surumNo || '1.0'}`

      const info = db
        .prepare(
          `INSERT INTO DATA_DosyaRevizyon 
           (temin_dosya_id, modul_adi, surec_kodu, belge_kodu, versiyon, baslik, icerik_html, veri_json, olusturan)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          dosyaId,
          'KUTUPHANE_BELGELERIM',
          'EK_BELGE',
          belgeKodu,
          versiyon,
          baslik || 'Kütüphane Belgesi',
          dondurulmusHtml || '',
          JSON.stringify({
            belge_id: belgeId,
            surum_no: surumNo,
            pinned: true,
            degerler: doldurulanDegerler,
            kesinlestirildi_at: new Date().toISOString()
          }),
          olusturan
        )

      return { success: true, revizyonId: info.lastInsertRowid }
    } catch (err: any) {
      console.error('[Kutuphane IPC] dosyaya-bagla error:', err)
      return { success: false, error: err.message }
    }
  })

  /**
   * Dosyaya bağlı ek belgeleri listeleme
   */
  ipcMain.handle('kutuphane:dosya-ek-belgeleri:list', async (_event, dosyaId: number) => {
    try {
      const db = getDb()
      const rows = db
        .prepare(
          `SELECT r.*, b.ad as belge_ad, b.grup_id
           FROM DATA_DosyaRevizyon r
           LEFT JOIN DATA_KutuphaneBelge b ON r.belge_kodu = ('kutuphane_belge_' || b.id)
           WHERE r.temin_dosya_id = ? AND r.modul_adi = 'KUTUPHANE_BELGELERIM'
           ORDER BY r.created_at DESC`
        )
        .all(dosyaId)

      return { success: true, data: rows }
    } catch (err: any) {
      console.error('[Kutuphane IPC] dosya-ek-belgeleri:list error:', err)
      return { success: false, error: err.message }
    }
  })

  /**
   * Kütüphane belgesini derleyip TANIM_Sablon tablosuna kaydetme / güncelleme
   */
  ipcMain.handle('kutuphane:sablona-yayinla', async (_event, payload: any) => {
    try {
      const db = getDb()
      const { belgeId, surumNo, ad, compileEdilmisMustacheHtml, kategori = 'Belgelerim' } = payload

      if (!belgeId || !ad) {
        throw new Error('belgeId ve ad zorunludur')
      }

      const dosyaAdi = `kutuphane_belge_${belgeId}.html`
      const aciklama = `Belgelerim eklentisinden derlendi (Sürüm v${surumNo || '1.0'})`

      // Mevcut şablon var mı kontrol et
      const existing = db.prepare('SELECT id FROM TANIM_Sablon WHERE dosya_adi = ?').get(dosyaAdi)

      let sablonId: number

      if (existing) {
        db.prepare(
          `UPDATE TANIM_Sablon
           SET ad = ?, icerik = ?, aciklama = ?, kategori = ?, aktif_mi = 1, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).run(ad, compileEdilmisMustacheHtml || '', aciklama, kategori, existing.id)
        sablonId = existing.id
      } else {
        const info = db
          .prepare(
            `INSERT INTO TANIM_Sablon
             (ad, dosya_adi, dosya_turu, icerik, aciklama, aktif_mi, kategori, route_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            ad,
            dosyaAdi,
            'html',
            compileEdilmisMustacheHtml || '',
            aciklama,
            1,
            kategori,
            '/kutuphane-belgelerim'
          )
        sablonId = info.lastInsertRowid as number
      }

      return { success: true, sablonId }
    } catch (err: any) {
      console.error('[Kutuphane IPC] sablona-yayinla error:', err)
      return { success: false, error: err.message }
    }
  })
}
