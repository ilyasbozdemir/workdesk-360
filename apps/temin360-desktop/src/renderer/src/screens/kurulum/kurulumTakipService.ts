/**
 * WorkDesk 360 / Temin 360 - Kurulum ve Veritabanı Tablo Takip Servisi
 *
 * Sıfırdan açılan veritabanlarında hangi tablolara ne eklendiğini izler,
 * kurulum durumunu ve adımlarını veritabanı (SYS_KurulumTakip ve settings) seviyesinde
 * saklayarak dosyanın farklı bilgisayarlarda da tutarlı davranmasını sağlar.
 */

export interface KurulumTakipItem {
  id?: number
  adim_kodu: string
  adim_adi: string
  tablo_adi: string
  kayit_sayisi: number
  durum: 'tamamlandi' | 'bekliyor' | 'atlandi'
  ozet_bilgi: string
  detay_json?: string | null
  updated_at?: string
}

export interface KurulumGenelDurumu {
  isNewWorkspace: boolean
  isSetupCompleted: boolean
  isSetupDismissed: boolean
  items: KurulumTakipItem[]
}

/**
 * Tablo varlığını ve kayıtlarını denetleyip SYS_KurulumTakip tablosunu günceller ve döndürür.
 */
export async function syncAndFetchKurulumTakip(): Promise<KurulumGenelDurumu> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) {
    return {
      isNewWorkspace: false,
      isSetupCompleted: true,
      isSetupDismissed: true,
      items: []
    }
  }

  const ipc = window.electron.ipcRenderer

  try {
    // 1. SYS_KurulumTakip tablosunun varlığını garanti et
    await ipc.invoke(
      'db:run',
      `CREATE TABLE IF NOT EXISTS SYS_KurulumTakip (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adim_kodu TEXT NOT NULL UNIQUE,
        adim_adi TEXT NOT NULL,
        tablo_adi TEXT NOT NULL,
        kayit_sayisi INTEGER DEFAULT 0,
        durum TEXT NOT NULL DEFAULT 'bekliyor',
        ozet_bilgi TEXT,
        detay_json TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    )

    // 2. Settings tablosundan kurulum meta verilerini çek
    const settingsRes = await ipc.invoke(
      'db:query',
      `SELECT key, value FROM settings WHERE key IN ('is_new_workspace', 'is_initial_setup_completed', 'setup_dismissed')`
    )
    const settingsMap: Record<string, string> = {}
    if (settingsRes?.success && Array.isArray(settingsRes.data)) {
      for (const row of settingsRes.data) {
        settingsMap[row.key] = row.value
      }
    }

    const isNewWorkspace = settingsMap['is_new_workspace'] === 'true'
    const isSetupCompleted = settingsMap['is_initial_setup_completed'] === 'true'
    const isSetupDismissed = settingsMap['setup_dismissed'] === 'true'

    // 3. İlgili tablolardan güncel verileri topla
    // 3.1. Kurum Bilgisi (TANIM_Kurum)
    const kurumRes = await ipc.invoke('db:query', 'SELECT * FROM TANIM_Kurum LIMIT 1')
    const kurumRow = kurumRes?.data?.[0]
    const kurumAdi = String(kurumRow?.kurum_adi || '').trim()
    const isKurumValid = kurumAdi && kurumAdi !== 'Yeni Kurum' && kurumAdi !== 'Bilinmeyen Kurum'

    let kurumOzet = isKurumValid ? kurumAdi : 'Kurum bilgisi henüz girilmedi'
    if (isKurumValid && (kurumRow?.il || kurumRow?.ilce)) {
      kurumOzet += ` (${[kurumRow.il, kurumRow.ilce].filter(Boolean).join('/')})`
    }
    if (kurumRow?.makam_adi) {
      kurumOzet += ` - Makam: ${kurumRow.makam_adi}`
    }

    // 3.2. Birimler (TANIM_Birim)
    const birimlerRes = await ipc.invoke(
      'db:query',
      'SELECT id, birim_adi, ad, antet_ek_satir FROM TANIM_Birim'
    )
    const birimlerList = Array.isArray(birimlerRes?.data) ? birimlerRes.data : []
    const birimSayisi = birimlerList.length
    const birimOzet =
      birimSayisi > 0
        ? `${birimSayisi} Birim (${birimlerList.map((b) => b.birim_adi || b.ad).slice(0, 3).join(', ')}${birimSayisi > 3 ? '...' : ''})`
        : 'Henüz harcama birimi eklenmedi'

    // 3.3. Personel Kadrosu (TANIM_Personel)
    const personelRes = await ipc.invoke(
      'db:query',
      'SELECT id, ad_soyad, unvan, gorev FROM TANIM_Personel'
    )
    const personelList = Array.isArray(personelRes?.data) ? personelRes.data : []
    const personelSayisi = personelList.length
    const personelOzet =
      personelSayisi > 0
        ? `${personelSayisi} Personel (${personelList.map((p) => p.ad_soyad).slice(0, 3).join(', ')}${personelSayisi > 3 ? '...' : ''})`
        : 'Henüz personel tanımlanmadı'

    // 3.4. Onay Rotası (TANIM_RotaDefaults veya settings)
    const rotaRes = await ipc.invoke(
      'db:query',
      `SELECT value FROM settings WHERE key LIKE 'rota_config_%' LIMIT 1`
    )
    const hasRotaConfig = Boolean(rotaRes?.data?.[0]?.value)
    const rotaOzet = hasRotaConfig
      ? 'Varsayılan imza ve onay rotası yapılandırıldı'
      : 'Onay rotası tanımlanmadı'

    // 3.5. Genel Kurulum Durumu
    const genelDurumOzet = isSetupCompleted
      ? 'İlk yapılandırma başarıyla tamamlandı'
      : isSetupDismissed
        ? 'Kurulum daha sonra tamamlanmak üzere ertelendi'
        : 'Kurulum bekleniyor'

    // 4. SYS_KurulumTakip tablosuna güncel durumları yaz / güncelle
    const items: KurulumTakipItem[] = [
      {
        adim_kodu: 'kurum',
        adim_adi: 'Kurum & Antet',
        tablo_adi: 'TANIM_Kurum',
        kayit_sayisi: isKurumValid ? 1 : 0,
        durum: isKurumValid ? 'tamamlandi' : 'bekliyor',
        ozet_bilgi: kurumOzet,
        detay_json: isKurumValid ? JSON.stringify(kurumRow) : null
      },
      {
        adim_kodu: 'birimler',
        adim_adi: 'Harcama Birimleri',
        tablo_adi: 'TANIM_Birim',
        kayit_sayisi: birimSayisi,
        durum: birimSayisi > 0 ? 'tamamlandi' : 'bekliyor',
        ozet_bilgi: birimOzet,
        detay_json: birimSayisi > 0 ? JSON.stringify(birimlerList.slice(0, 10)) : null
      },
      {
        adim_kodu: 'personeller',
        adim_adi: 'Personel Kadrosu',
        tablo_adi: 'TANIM_Personel',
        kayit_sayisi: personelSayisi,
        durum: personelSayisi > 0 ? 'tamamlandi' : 'bekliyor',
        ozet_bilgi: personelOzet,
        detay_json: personelSayisi > 0 ? JSON.stringify(personelList.slice(0, 10)) : null
      },
      {
        adim_kodu: 'rota',
        adim_adi: 'Varsayılan Onay Rotası',
        tablo_adi: 'settings (rota)',
        kayit_sayisi: hasRotaConfig ? 1 : 0,
        durum: hasRotaConfig ? 'tamamlandi' : 'bekliyor',
        ozet_bilgi: rotaOzet,
        detay_json: null
      },
      {
        adim_kodu: 'tamamlandi',
        adim_adi: 'Genel Kurulum Durumu',
        tablo_adi: 'settings',
        kayit_sayisi: isSetupCompleted ? 1 : 0,
        durum: isSetupCompleted ? 'tamamlandi' : isSetupDismissed ? 'atlandi' : 'bekliyor',
        ozet_bilgi: genelDurumOzet,
        detay_json: null
      }
    ]

    for (const item of items) {
      await ipc.invoke(
        'db:run',
        `INSERT INTO SYS_KurulumTakip (adim_kodu, adim_adi, tablo_adi, kayit_sayisi, durum, ozet_bilgi, detay_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(adim_kodu) DO UPDATE SET
           kayit_sayisi = excluded.kayit_sayisi,
           durum = excluded.durum,
           ozet_bilgi = excluded.ozet_bilgi,
           detay_json = excluded.detay_json,
           updated_at = CURRENT_TIMESTAMP`,
        [
          item.adim_kodu,
          item.adim_adi,
          item.tablo_adi,
          item.kayit_sayisi,
          item.durum,
          item.ozet_bilgi,
          item.detay_json
        ]
      )
    }

    return {
      isNewWorkspace,
      isSetupCompleted,
      isSetupDismissed,
      items
    }
  } catch (err) {
    console.warn('[kurulumTakipService] Hata oluştu:', err)
    return {
      isNewWorkspace: false,
      isSetupCompleted: false,
      isSetupDismissed: false,
      items: []
    }
  }
}

/**
 * Kullanıcı kurulum modalını kapattığında (Daha sonra kur / İptal),
 * bu kararı doğrudan veritabanındaki settings tablosuna kalıcı olarak yazar.
 * Böylece dosya farklı bir bilgisayara götürüldüğünde zorla popup açılmaz.
 */
export async function dismissKurulumInDatabase(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return false
  try {
    await window.electron.ipcRenderer.invoke('db:save-settings', {
      setup_dismissed: 'true'
    })
    await window.electron.ipcRenderer.invoke(
      'db:run',
      `UPDATE SYS_KurulumTakip 
       SET durum = 'atlandi', ozet_bilgi = 'Kullanıcı tarafından ertelendi', updated_at = CURRENT_TIMESTAMP
       WHERE adim_kodu = 'tamamlandi'`
    )
    return true
  } catch (err) {
    console.error('[dismissKurulumInDatabase] Kaydedilemedi:', err)
    return false
  }
}

/**
 * Kurulum tamamlandığında veritabanı ayarlarını ve takip kaydını mühürler.
 */
export async function completeKurulumInDatabase(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return false
  try {
    await window.electron.ipcRenderer.invoke('db:save-settings', {
      is_new_workspace: 'false',
      is_initial_setup_completed: 'true',
      setup_dismissed: 'true',
      setup_completed_at: new Date().toISOString()
    })
    await window.electron.ipcRenderer.invoke(
      'db:run',
      `UPDATE SYS_KurulumTakip 
       SET durum = 'tamamlandi', ozet_bilgi = 'Kurulum başarıyla tamamlandı', updated_at = CURRENT_TIMESTAMP
       WHERE adim_kodu = 'tamamlandi'`
    )
    return true
  } catch (err) {
    console.error('[completeKurulumInDatabase] Kaydedilemedi:', err)
    return false
  }
}
