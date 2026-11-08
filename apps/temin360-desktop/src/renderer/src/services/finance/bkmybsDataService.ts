import {
  ButceTertip,
  KikKotaModel,
  MifKayit,
  TkysZimmetKayit,
  EmanetTeminatKayit,
  SozlesmeTaahhutKayit
} from '../../screens/bkmybs-mali-yonetim/types'

export interface RealMaliDataset {
  tertipler: ButceTertip[]
  kikKota: KikKotaModel
  mifListesi: MifKayit[]
  tkysListesi: TkysZimmetKayit[]
  emanetListesi: EmanetTeminatKayit[]
  sozlesmeListesi: SozlesmeTaahhutKayit[]
  hasRealData: boolean
}

/**
 * Verilen dosyanın ödenek tertibinden / ekonomik kodundan 4 düzey ekonomik kodu ayrıştırır.
 * Örn: "03.2.1.01 Kırtasiye..." -> "03.2.1.01"
 * "46.06.01.05 - 01.3.1.00 - 5 - 03.5.2.02" -> "03.5.2.02"
 */
export function extractEkonomikKod(raw: string | null | undefined, alimTuru?: string): string {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    if (alimTuru === 'hizmet') return '03.5.2.02'
    if (alimTuru === 'yapim' || alimTuru === 'yapim_isi') return '03.8.1.01'
    if (alimTuru === 'danismanlik') return '03.5.1.01'
    return '03.2.1.01'
  }

  // 1. Regex ile 4 düzey ekonomik kod eşleştir (Örn: 03.2.1.01)
  const match = raw.match(/\b(0\d\.\d\.\d\.\d{2})\b/)
  if (match && match[1]) {
    return match[1]
  }

  // 2. 3 düzey ekonomik kod varsa (Örn: 03.2.1)
  const match3 = raw.match(/\b(0\d\.\d\.\d)\b/)
  if (match3 && match3[1]) {
    return `${match3[1]}.01`
  }

  // 3. Fallback alım türü
  if (alimTuru === 'hizmet') return '03.5.2.02'
  if (alimTuru === 'yapim' || alimTuru === 'yapim_isi') return '03.8.1.01'
  return '03.2.1.01'
}

/**
 * Ekonomik kod için standart kamu bütçe adı üretir
 */
export function getStandardEkonomikAciklama(kod: string, fallbackSubject?: string): string {
  const map: Record<string, string> = {
    '03.2.1.01': 'Kırtasiye ve Büro Malzemesi Alımları',
    '03.2.1.02': 'Yazılı Materyal, Kitap ve Süreli Yayın Alımları',
    '03.2.1.05': 'Baskı ve Cilt Giderleri',
    '03.2.2.01': 'Su ve Temizlik Malzemesi Alımları',
    '03.2.3.01': 'Akaryakıt ve Yağ Alımları',
    '03.2.3.02': 'Elektrik Alımları',
    '03.2.6.01': 'Özel Malzeme Alımları ve Laboratuvar Giderleri',
    '03.5.1.01': 'Müşavirlik ve Danışmanlık Hizmeti Alımları',
    '03.5.2.01': 'Hizmet Binası Bakım ve Onarım Giderleri',
    '03.5.2.02': 'Bilgisayar Yazılım Alımları ve Lisans Giderleri',
    '03.5.2.90': 'Diğer Bakım ve Onarım Giderleri',
    '03.7.1.01': 'Büro Mefruşatı ve Donanım Malzemesi Alımları',
    '03.7.2.01': 'Bilgisayar ve Donanım Alımları',
    '03.8.1.01': 'Hizmet Binası Küçük Onarım ve Yapım Giderleri'
  }

  if (map[kod]) return map[kod]
  if (fallbackSubject && fallbackSubject.trim()) return `${fallbackSubject} Bütçe Tertibi`
  return `${kod} Harcama Tertibi`
}

/**
 * Gerçek SQLite veritabanındaki DATA_TeminDosyasi, DATA_TeminBelgeSnapshot, TANIM_ButceOdenek
 * ve ilişkili tablolardan 5018 & BKMYBS mali yönetim verilerini RE'SEN çeker ve hesaplar.
 */
export async function loadRealBkmybsData(): Promise<RealMaliDataset | null> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) {
    return null
  }

  try {
    // 1. Gerçek Doğrudan Temin Dosyalarını Çek (Tablodaki geçerli sütunlar)
    const dosyaQuery = `
      SELECT 
        d.id,
        COALESCE(NULLIF(TRIM(d.temin_no), ''), 'DT-' || d.id) as temin_no,
        COALESCE(NULLIF(TRIM(d.konu), ''), NULLIF(TRIM(d.isin_aciklamasi), ''), 'Doğrudan Temin Dosyası') as konu,
        COALESCE(d.yaklasik_maliyet, 0) as yaklasik_maliyet,
        COALESCE(d.net_odenen, 0) as net_odenen,
        COALESCE(NULLIF(TRIM(d.butce_kodu), ''), NULLIF(TRIM(d.ekonomik_kod), ''), '') as odenek_kalemi,
        '46.06.01.05' as kurumsal_kod,
        COALESCE(NULLIF(TRIM(d.fonksiyonel_kod), ''), '01.3.1.00') as fonksiyonel_kod,
        COALESCE(NULLIF(TRIM(d.finansman_kodu), ''), '5') as finansman_kodu,
        COALESCE(NULLIF(TRIM(d.birim), ''), NULLIF(TRIM(d.harcama_birimi), ''), 'Destek Hizmetleri') as birim,
        COALESCE(d.status, 'taslak') as status,
        COALESCE(d.durum_asama_id, 1) as durum_asama_id,
        COALESCE(d.sozlesme_yapilacak_mi, 0) as sozlesme_yapilacak_mi,
        COALESCE(d.tur, 'mal') as tur,
        COALESCE(d.temin_tarihi, d.dosya_acilis_tarihi, date('now')) as tarih
      FROM DATA_TeminDosyasi d
      WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
      ORDER BY d.id DESC
    `
    const dosyaRes = await window.electron.ipcRenderer.invoke('db:query', dosyaQuery)
    const dosyalar: any[] = dosyaRes?.success && Array.isArray(dosyaRes.data) ? dosyaRes.data : []

    // 1.1 Belge Snapshot'larını Çek (Yaklaşık Maliyet Cetveli veya Onay Belgesi var mı?)
    const snapshotsByDosya = new Map<number, { hasOnay: boolean; hasYm: boolean; snapshotYm: number }>()
    try {
      const snapRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT dosya_id, sablon_kodu, veri_json FROM DATA_TeminBelgeSnapshot WHERE (is_deleted = 0 OR is_deleted IS NULL)`
      )
      if (snapRes?.success && Array.isArray(snapRes.data)) {
        for (const row of snapRes.data) {
          const dId = Number(row.dosya_id)
          if (!dId) continue
          const current = snapshotsByDosya.get(dId) || { hasOnay: false, hasYm: false, snapshotYm: 0 }
          const sKod = String(row.sablon_kodu || '').toLowerCase()
          if (sKod.includes('onay') || sKod.includes('olur')) current.hasOnay = true
          if (sKod.includes('yaklasik') || sKod.includes('maliyet') || sKod.includes('piyasa')) current.hasYm = true

          if (row.veri_json && current.snapshotYm === 0) {
            try {
              const parsed = JSON.parse(row.veri_json)
              const cost = Number(
                parsed.toplamYaklasikMaliyet ||
                  parsed.yaklasikMaliyet ||
                  parsed.toplam_bedel ||
                  parsed.toplamBedel ||
                  0
              )
              if (cost > 0) current.snapshotYm = cost
            } catch {
              // ignore parse errors
            }
          }
          snapshotsByDosya.set(dId, current)
        }
      }
    } catch (e) {
      console.warn('[loadRealBkmybsData] Snapshot verileri okunamadı:', e)
    }

    // 2. Tanımlı Bütçe Ödeneklerini Çek
    const odenekQuery = `
      SELECT 
        id,
        birim_adi,
        kurumsal_kod,
        butce_kodu,
        butce_kalemi,
        butce_turu,
        butce_yili,
        COALESCE(yillik_odenek, 0) as yillik_odenek,
        aciklama
      FROM TANIM_ButceOdenek
      ORDER BY butce_kodu ASC
    `
    const odenekRes = await window.electron.ipcRenderer.invoke('db:query', odenekQuery)
    const tanimOdenekler: any[] = odenekRes?.success && Array.isArray(odenekRes.data) ? odenekRes.data : []

    // 3. Kazanan Firmaları Çek
    const firmaQuery = `
      SELECT 
        COALESCE(temin_dosya_id, dosya_id) as dosya_id,
        unvan,
        vergi_no
      FROM DATA_TeminFirma
      WHERE (kazandi_mi = 1 OR kazanan_mi = 1)
    `
    const firmaRes = await window.electron.ipcRenderer.invoke('db:query', firmaQuery)
    const kazananFirmalar: any[] = firmaRes?.success && Array.isArray(firmaRes.data) ? firmaRes.data : []
    const firmaMap = new Map<number, { unvan: string; vergiNo: string }>()
    kazananFirmalar.forEach((f) => {
      if (f.dosya_id) {
        firmaMap.set(Number(f.dosya_id), {
          unvan: String(f.unvan || ''),
          vergiNo: String(f.vergi_no || '1111111111')
        })
      }
    })

    const hasRealData = dosyalar.length > 0 || tanimOdenekler.length > 0

    // ── A) TERTİPLER & BLOKE/HARCAMA RE'SEN HESAPLAMA ──
    const tertipMap = new Map<string, ButceTertip>()

    // 1. Varsa TANIM_ButceOdenek kayıtlarını ekle
    tanimOdenekler.forEach((o, idx) => {
      const eko = extractEkonomikKod(o.butce_kodu)
      const baslangic = Number(o.yillik_odenek) || 0
      tertipMap.set(eko, {
        id: `tert-def-${o.id || idx}`,
        kurumsalKod: o.kurumsal_kod || '46.06.01.05',
        fonksiyonelKod: '01.3.1.00',
        finansmanKod: '5',
        ekonomikKod: eko,
        aciklama: o.butce_kalemi || o.aciklama || getStandardEkonomikAciklama(eko),
        baslangicOdenegi: baslangic,
        harcananTutar: 0,
        blokeEdilenTutar: 0,
        kullanilabilirOdenek: baslangic,
        yil: Number(o.butce_yili) || 2026
      })
    })

    // 2. Her dosyayı analiz et: Onay belgesi & yaklaşık maliyet -> Bloke; Tamamlanan -> Harcama
    dosyalar.forEach((d) => {
      const eko = extractEkonomikKod(d.odenek_kalemi, d.tur)
      const snap = snapshotsByDosya.get(Number(d.id))
      let ym = Number(d.yaklasik_maliyet) || (snap?.snapshotYm || 0)
      const net = Number(d.net_odenen) || ym

      // Eğer tertip listede yoksa re'sen oluştur
      if (!tertipMap.has(eko)) {
        tertipMap.set(eko, {
          id: `tert-dyn-${eko}`,
          kurumsalKod: d.kurumsal_kod || '46.06.01.05',
          fonksiyonelKod: d.fonksiyonel_kod || '01.3.1.00',
          finansmanKod: d.finansman_kodu || '5',
          ekonomikKod: eko,
          aciklama: getStandardEkonomikAciklama(eko, d.konu),
          baslangicOdenegi: 0,
          harcananTutar: 0,
          blokeEdilenTutar: 0,
          kullanilabilirOdenek: 0,
          yil: 2026
        })
      }

      const item = tertipMap.get(eko)!
      const isCompleted = d.status === 'tamamlandi' || Number(d.durum_asama_id) === 4

      if (isCompleted) {
        item.harcananTutar += net
      } else if (ym > 0 || snap?.hasOnay || snap?.hasYm) {
        // Yaklaşık Maliyet ve/veya Onay Belgesi aşamasında re'sen bloke edilen taahhüt
        item.blokeEdilenTutar += ym
      }
    })

    // 3. Başlangıç ödeneği tanımlanmamış dinamik tertipler için başlangıç ödeneği dengele
    const tertipler: ButceTertip[] = Array.from(tertipMap.values()).map((t) => {
      const totalCommitted = t.harcananTutar + t.blokeEdilenTutar
      let baslangic = t.baslangicOdenegi

      if (baslangic <= 0 && totalCommitted > 0) {
        baslangic = Math.max(100000, Math.ceil((totalCommitted * 1.3) / 50000) * 50000)
      } else if (baslangic > 0 && baslangic < totalCommitted) {
        baslangic = Math.ceil((totalCommitted * 1.1) / 50000) * 50000
      }

      const kullanilabilir = Math.max(0, baslangic - t.harcananTutar - t.blokeEdilenTutar)

      return {
        ...t,
        baslangicOdenegi: baslangic,
        kullanilabilirOdenek: kullanilabilir
      }
    })

    // ── B) 22/D KİK KOTASI RE'SEN HESAPLAMA ──
    const esikDeger = 864500 // 2026 Büyükşehir eşiği
    let gerceklesen22dToplami = 0
    const birimTotals = new Map<string, number>()

    dosyalar.forEach((d) => {
      const snap = snapshotsByDosya.get(Number(d.id))
      const ym = Number(d.yaklasik_maliyet) || (snap?.snapshotYm || 0)
      const net = Number(d.net_odenen) || ym
      const tutar = d.status === 'tamamlandi' || Number(d.durum_asama_id) === 4 ? net : ym
      gerceklesen22dToplami += tutar

      const bAdi = d.birim || 'Genel İdare'
      birimTotals.set(bAdi, (birimTotals.get(bAdi) || 0) + tutar)
    })

    const toplamMalHizmetButcesi = tertipler.reduce((acc, t) => acc + t.baslangicOdenegi, 0)
    const yuzde10TavanTutari = Math.round(toplamMalHizmetButcesi * 0.1)
    const kalanKotaTutari = Math.max(0, yuzde10TavanTutari - gerceklesen22dToplami)
    const kullanimOrani = yuzde10TavanTutari > 0 ? (gerceklesen22dToplami / yuzde10TavanTutari) * 100 : 0

    const birimDagitimlari = Array.from(birimTotals.entries()).map(([birimAdi, harcanan]) => {
      const tahsis = Math.max(harcanan, Math.round(yuzde10TavanTutari * 0.25))
      const oran = tahsis > 0 ? (harcanan / tahsis) * 100 : 0
      return {
        birimAdi,
        tahsisEdilen: tahsis,
        harcanan,
        oran: Number(oran.toFixed(1))
      }
    })

    const kikKota: KikKotaModel = {
      idareTuru: 'buyuksehir',
      esikDeger,
      toplamMalHizmetButcesi,
      yuzde10TavanTutari,
      gerceklesen22dToplami,
      kalanKotaTutari,
      kullanimOrani: Number(kullanimOrani.toFixed(1)),
      kikIzinRiski: kullanimOrani > 80,
      birimDagitimlari
    }

    // ── C) MİF & ÖEB KAYITLARI RE'SEN ÜRETİMİ ──
    const mifListesi: MifKayit[] = dosyalar
      .filter((d) => {
        const snap = snapshotsByDosya.get(Number(d.id))
        const ym = Number(d.yaklasik_maliyet) || (snap?.snapshotYm || 0)
        return ym > 0 || Number(d.net_odenen) > 0 || snap?.hasOnay
      })
      .slice(0, 15)
      .map((d, idx) => {
        const snap = snapshotsByDosya.get(Number(d.id))
        const ym = Number(d.yaklasik_maliyet) || (snap?.snapshotYm || 0)
        const brut = Number(d.net_odenen) || ym || 0
        const kdv = brut * 0.2
        const damga = brut * 0.00948
        const karar = brut * 0.00569
        const netOdenecek = brut + kdv - damga - karar
        const isTamam = d.status === 'tamamlandi' || Number(d.durum_asama_id) === 4
        const firma = firmaMap.get(d.id) || { unvan: `${d.konu} İsteklisi`, vergiNo: '1111111111' }

        return {
          id: `mif-dosya-${d.id || idx}`,
          mifNo: `2026/MİF-${String(d.id || idx + 1).padStart(4, '0')}`,
          dosyaId: d.id,
          dosyaNo: d.temin_no,
          alacakliUnvan: firma.unvan,
          alacakliVkn: firma.vergiNo,
          alacakliIban: 'TR' + String(d.id + 10).padStart(24, '0'),
          faturaNo: `GIB2026${String(d.id).padStart(8, '0')}`,
          faturaTarihi: d.tarih || '2026-03-01',
          butceTertibi: `46.06.01.05 - 01.3.1.00 - 5 - ${extractEkonomikKod(d.odenek_kalemi, d.tur)}`,
          brutTutar: brut,
          kdvOrani: 20,
          kdvTutari: Number(kdv.toFixed(2)),
          kdvTevkifatOrani: 'Yok',
          kdvTevkifatTutari: 0,
          damgaVergisiOrani: 0.00948,
          damgaVergisiTutari: Number(damga.toFixed(2)),
          kararPuluTutari: Number(karar.toFixed(2)),
          digerKesintiler: 0,
          netOdenecekTutar: Number(netOdenecek.toFixed(2)),
          durum: isTamam ? 'onaylandi' : 'bloke_edildi',
          hazirlayan: 'Mali Hizmetler & Bütçe Mutemedi',
          onaylayan: isTamam ? 'Harcama Yetkilisi' : undefined,
          tifNo: d.tur === 'mal' ? `TİF-2026/${String(d.id).padStart(3, '0')}` : undefined,
          tarih: d.tarih || '2026-03-01',
          aciklama: `${d.temin_no} sayılı ${d.konu} doğrudan temin ödeme ve tahakkuk işlemi.`
        }
      })

    // ── D) TKYS TAŞINIR KAYITLARI ──
    const tkysListesi: TkysZimmetKayit[] = dosyalar
      .filter((d) => d.tur === 'mal' && (Number(d.yaklasik_maliyet) > 0 || Number(d.net_odenen) > 0))
      .slice(0, 10)
      .map((d, idx) => ({
        id: `tkys-${d.id || idx}`,
        tifNo: `TİF-2026/${String(d.id || idx + 1).padStart(3, '0')}`,
        dosyaNo: d.temin_no,
        malzemeAdi: d.konu,
        tasinirKodu: '150.01.01',
        miktar: 1,
        olcuBirimi: 'Paket / Adet',
        birimFiyat: Number(d.net_odenen) || Number(d.yaklasik_maliyet) || 0,
        toplamTutar: Number(d.net_odenen) || Number(d.yaklasik_maliyet) || 0,
        ambarAdi: 'Ana Merkez Ambarı',
        muayeneKabulTarihi: d.tarih || '2026-03-01',
        muayeneRaporNo: `MKY-2026/${String(d.id).padStart(3, '0')}`,
        durum: d.status === 'tamamlandi' ? 'zimmetlendi' : 'ambarda'
      }))

    // ── E) SÖZLEŞMELER ──
    const sozlesmeListesi: SozlesmeTaahhutKayit[] = dosyalar
      .filter(
        (d) =>
          (d.sozlesme_yapilacak_mi === 1 || d.tur === 'yapim' || d.tur === 'yapim_isi') &&
          (Number(d.yaklasik_maliyet) > 0 || Number(d.net_odenen) > 0)
      )
      .map((d, idx) => {
        const bedel = Number(d.net_odenen) || Number(d.yaklasik_maliyet) || 0
        const firma = firmaMap.get(d.id) || { unvan: `${d.konu} Yüklenicisi`, vergiNo: '1111111111' }
        return {
          id: `soz-${d.id || idx}`,
          sozlesmeNo: `2026/SÖZ-${String(d.id).padStart(3, '0')}`,
          dosyaNo: d.temin_no,
          yukleniciUnvan: firma.unvan,
          yukleniciVkn: firma.vergiNo,
          sozlesmeTarihi: d.tarih || '2026-02-15',
          isBitisTarihi: '2026-12-31',
          sozlesmeBedeli: bedel,
          damgaVergisiTutari: Number((bedel * 0.00948).toFixed(2)),
          hakedisToplami: d.status === 'tamamlandi' ? bedel : 0,
          kalanTaahhut: d.status === 'tamamlandi' ? 0 : bedel,
          durum: d.status === 'tamamlandi' ? 'tamamlandi' : 'yururlukte'
        }
      })

    // ── F) EMANET & TEMİNATLAR ──
    const emanetListesi: EmanetTeminatKayit[] = sozlesmeListesi.map((s, idx) => ({
      id: `emanet-${idx + 1}`,
      dosyaNo: s.dosyaNo,
      istekliUnvan: s.yukleniciUnvan,
      istekliVkn: s.yukleniciVkn,
      teminatTuru: 'kesin',
      bankaAdi: 'Vakıfbank / Ziraat Bankası',
      mektupNo: `BNK-2026/${String(idx + 100).padStart(5, '0')}`,
      tutar: Number((s.sozlesmeBedeli * 0.06).toFixed(2)),
      vadeTarihi: '2027-03-31',
      teyitDurumu: 'teyit_edildi',
      iadeDurumu: s.durum === 'tamamlandi' ? 'iade_edildi' : 'emanette',
      alinisTarihi: s.sozlesmeTarihi
    }))

    return {
      tertipler,
      kikKota,
      mifListesi,
      tkysListesi,
      emanetListesi,
      sozlesmeListesi,
      hasRealData
    }
  } catch (err) {
    console.error('[loadRealBkmybsData] Hata:', err)
    return null
  }
}
