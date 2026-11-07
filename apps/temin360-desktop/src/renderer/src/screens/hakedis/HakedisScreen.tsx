import React, { useState, useEffect, useMemo } from 'react'
import {
  Hammer,
  FileSpreadsheet,
  Layers,
  Calculator,
  Receipt,
  FileCheck2,
  Printer,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Building2,
  Coins
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useWorkspaceContextStore } from '../../store/workspaceContextStore'
import { useSettingsStore } from '../../store/settingsStore'
import { HakedisOzetKapak } from './components/HakedisOzetKapak'
import { YesilDefterMetraj } from './components/YesilDefterMetraj'
import { FiyatFarkiHesaplayici } from './components/FiyatFarkiHesaplayici'
import { KesintilerVeStopaj } from './components/KesintilerVeStopaj'
import { DiziPusulasiVeImzalar } from './components/DiziPusulasiVeImzalar'
import {
  HakedisKalem,
  FiyatFarkiParametreleri,
  KesintiParametreleri,
  HakedisBilgileri
} from './types'

export default function HakedisScreen(): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()
  const { setActiveWorkspace, setActiveFinanceTab } = useWorkspaceContextStore()
  const { institutionName } = useSettingsStore()

  // 1. Sekme Durumu
  type TabType = 'ozet' | 'yesil_defter' | 'fiyat_farki' | 'kesintiler' | 'dizi_pusulasi'
  const [activeTab, setActiveTab] = useState<TabType>('ozet')

  // 2. Hakediş Genel Bilgileri
  const [bilgiler, setBilgiler] = useState<HakedisBilgileri>({
    hakedisNo: 1,
    hakedisTarihi: new Date().toISOString().split('T')[0],
    hakedisTuru: 'ara_hakedis',
    dosyaId: activeDosyaId || null,
    dosyaNo: activeDosyaId ? `2026/DT-${activeDosyaId}` : '2026/DT-101',
    isAdi: 'İdari Bina Bakım Onarım ve Donanım Temini',
    yukleniciFirma: 'Marmara Mühendislik ve Taahhüt A.Ş.',
    sozlesmeTarihi: '2026-01-15',
    iseBaslamaTarihi: '2026-01-20',
    isBitimTarihi: '2026-12-31',
    sureUzatimiGun: 0,
    sozlesmeBedeli: 450000,
    oncekiHakedislerToplami: 0
  })

  // 3. Kalemler / Yeşil Defter
  const [kalemler, setKalemler] = useState<HakedisKalem[]>([
    {
      id: 'k-1',
      pozNo: '15.120.1001',
      aciklama: 'C 25/30 Basınç Dayanım Sınıfında Hazır Beton Dökülmesi',
      birim: 'm³',
      sozlesmeMiktar: 120,
      birimFiyat: 2400,
      oncekiMetraj: 0,
      buHakedisMetraj: 45
    },
    {
      id: 'k-2',
      pozNo: '15.160.1003',
      aciklama: 'Nervürlü Çelik Hasır ve Bağlantı Elemanları Temini',
      birim: 'kg',
      sozlesmeMiktar: 4500,
      birimFiyat: 28,
      oncekiMetraj: 0,
      buHakedisMetraj: 1500
    },
    {
      id: 'k-3',
      pozNo: '22/d-03',
      aciklama: 'Ağ Altyapısı Cat6 Kablolama ve Sonlandırma Hizmeti',
      birim: 'Metre',
      sozlesmeMiktar: 800,
      birimFiyat: 45,
      oncekiMetraj: 0,
      buHakedisMetraj: 300
    }
  ])

  // 4. Fiyat Farkı Parametreleri
  const [fiyatFarki, setFiyatFarki] = useState<FiyatFarkiParametreleri>({
    aktifMi: true,
    temelEndeksI0: 3250.4,
    guncelEndeksIn: 3480.2,
    iscilikKatsayisiA1: 0.3,
    malzemeKatsayisiA2: 0.5,
    akaryakitKatsayisiB1: 0.1,
    makineKatsayisiB2: 0.1
  })

  // 5. Kesintiler ve Stopaj
  const [kesintiler, setKesintiler] = useState<KesintiParametreleri>({
    stopajOrani: 0.05, // %5
    damgaVergisiOrani: 0.00948, // ‰ 9.48
    kararPuluOrani: 0.00569, // ‰ 5.69
    kdvOrani: 0.2, // %20
    kdvTevkifatOraniPay: 4,
    kdvTevkifatOraniPayda: 10,
    avansMahsubu: 0,
    cezaVeDigerKesintiler: 0,
    teminatKesintisiOrani: 0
  })

  // Gerçek SQLite Dosyasından Bilgileri Çek
  useEffect(() => {
    if (!activeDosyaId || typeof window === 'undefined' || !(window as any).electronAPI) return

    const loadRealDosyaData = async () => {
      try {
        const result = await (window as any).electronAPI.executeRawQuery(
          `SELECT d.*, f.unvan as yuklenici_adi 
           FROM DATA_TeminDosyasi d 
           LEFT JOIN TANIM_Firma f ON d.kazanan_firma_id = f.id 
           WHERE d.id = ? LIMIT 1`,
          [activeDosyaId]
        )

        if (result && result.length > 0) {
          const row = result[0]
          setBilgiler((prev) => ({
            ...prev,
            dosyaId: row.id,
            dosyaNo: row.dosya_no || `2026/DT-${row.id}`,
            isAdi: row.isin_adi || row.konu || prev.isAdi,
            yukleniciFirma: row.yuklenici_adi || prev.yukleniciFirma,
            sozlesmeBedeli: Number(row.sozlesme_bedeli) || Number(row.toplam_yaklasik_maliyet) || prev.sozlesmeBedeli
          }))
        }
      } catch (err) {
        console.warn('[HakedisScreen] SQLite veri okuma hatası:', err)
      }
    }

    loadRealDosyaData()
  }, [activeDosyaId])

  // Aktif Dosya Kalemlerini SQLite'dan Çek
  const handleLoadFromActiveDosya = async () => {
    if (!activeDosyaId || typeof window === 'undefined' || !(window as any).electronAPI) return
    try {
      const items = await (window as any).electronAPI.executeRawQuery(
        `SELECT id, sira_no, aciklama, birim, miktar, birim_fiyat 
         FROM DATA_TeminKalem 
         WHERE dosya_id = ? 
         ORDER BY sira_no ASC`,
        [activeDosyaId]
      )

      if (items && items.length > 0) {
        const mappedKalemler: HakedisKalem[] = items.map((it: any, idx: number) => ({
          id: 'kalem-' + it.id,
          pozNo: `POZ-${idx + 1}`,
          aciklama: it.aciklama || 'Kalem ' + (idx + 1),
          birim: it.birim || 'Adet',
          sozlesmeMiktar: Number(it.miktar) || 1,
          birimFiyat: Number(it.birim_fiyat) || 100,
          oncekiMetraj: 0,
          buHakedisMetraj: Number(it.miktar) || 1
        }))
        setKalemler(mappedKalemler)
      }
    } catch (err) {
      console.warn('[HakedisScreen] Kalemleri çekme hatası:', err)
    }
  }

  // Hesaplamalar
  const buHakedisImalatTutari = useMemo(() => {
    return kalemler.reduce((acc, k) => acc + k.buHakedisMetraj * k.birimFiyat, 0)
  }, [kalemler])

  const hesaplananFiyatFarki = useMemo(() => {
    if (!fiyatFarki.aktifMi || fiyatFarki.temelEndeksI0 <= 0) return 0
    const endeksKatsayisi = fiyatFarki.guncelEndeksIn / fiyatFarki.temelEndeksI0 - 1
    const agirlikliOran =
      fiyatFarki.iscilikKatsayisiA1 +
      fiyatFarki.malzemeKatsayisiA2 +
      fiyatFarki.akaryakitKatsayisiB1 +
      fiyatFarki.makineKatsayisiB2
    return Math.max(0, buHakedisImalatTutari * endeksKatsayisi * agirlikliOran)
  }, [buHakedisImalatTutari, fiyatFarki])

  const brutHakedisTutari = buHakedisImalatTutari + hesaplananFiyatFarki

  const hesaplananStopaj = brutHakedisTutari * kesintiler.stopajOrani
  const hesaplananDamga = brutHakedisTutari * kesintiler.damgaVergisiOrani
  const hesaplananKararPulu = brutHakedisTutari * kesintiler.kararPuluOrani
  const hesaplananKdv = brutHakedisTutari * kesintiler.kdvOrani

  const hesaplananKdvTevkifat = useMemo(() => {
    if (kesintiler.kdvTevkifatOraniPayda <= 0) return 0
    return (
      (hesaplananKdv * kesintiler.kdvTevkifatOraniPay) / kesintiler.kdvTevkifatOraniPayda
    )
  }, [hesaplananKdv, kesintiler.kdvTevkifatOraniPay, kesintiler.kdvTevkifatOraniPayda])

  const toplamKesintiler =
    hesaplananStopaj +
    hesaplananDamga +
    hesaplananKararPulu +
    hesaplananKdvTevkifat +
    kesintiler.avansMahsubu +
    kesintiler.cezaVeDigerKesintiler

  const netOdenecekTutar = Math.max(0, brutHakedisTutari + hesaplananKdv - toplamKesintiler)

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2
    }).format(val)
  }

  // 5018 Mali Hizmetler ÖEB'ye Aktar
  const handleAktarToOeb = () => {
    setActiveWorkspace('finance')
    setActiveFinanceTab('oeb-drafts')
  }

  // A4 Yazdır
  const handlePrintA4 = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. ÜST HERO BAŞLIK & BİLGİ ALANI */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Hammer size={180} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hakediş.org &amp; Kamu Standardı
              </span>
              <span className="text-xs text-slate-400">• 4734 &amp; 5018 Sayılı Kanunlar</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Hammer className="text-emerald-400" size={24} />
              Kamu Hakediş Masası &amp; Yeşil Defter Cetveli
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              İmalat metrajları, fiyat farkı hesabı, yasal kesintiler ve dizi pusulası ile resmî
              hakediş tahakkuku.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Hakediş No Seçici */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-semibold text-slate-300">Hakediş No:</span>
              <select
                value={bilgiler.hakedisNo}
                onChange={(e) =>
                  setBilgiler({ ...bilgiler, hakedisNo: parseInt(e.target.value, 10) })
                }
                className="bg-slate-800 text-white font-bold text-xs rounded px-2 py-1 border border-slate-700"
              >
                <option value={1}>1. Hakediş</option>
                <option value={2}>2. Hakediş</option>
                <option value={3}>3. Hakediş</option>
                <option value={4}>4. Hakediş</option>
                <option value={5}>5. Hakediş (Kesin Hakediş)</option>
              </select>
            </div>

            <button
              onClick={handlePrintA4}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all border border-white/10 cursor-pointer"
            >
              <Printer size={15} />
              <span>Yazdır (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 5 SEKMELİ HAKEDİŞ.ORG GEÇİŞ MENÜSÜ */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('ozet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ozet'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>Hakediş İcmali &amp; Kapak</span>
        </button>

        <button
          onClick={() => setActiveTab('yesil_defter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'yesil_defter'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={15} />
          <span>Yeşil Defter &amp; Metraj ({kalemler.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fiyat_farki')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'fiyat_farki'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator size={15} />
          <span>Fiyat Farkı Hesabı (4734 m.8)</span>
          {fiyatFarki.aktifMi && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-black">
              AKTİF
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kesintiler')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'kesintiler'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt size={15} />
          <span>Kesintiler &amp; Stopaj</span>
        </button>

        <button
          onClick={() => setActiveTab('dizi_pusulasi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dizi_pusulasi'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 size={15} />
          <span>Dizi Pusulası &amp; İmzalar</span>
        </button>
      </div>

      {/* 3. AKTİF SEKME İÇERİĞİ */}
      <div className="min-h-[500px]">
        {activeTab === 'ozet' && (
          <HakedisOzetKapak
            bilgiler={bilgiler}
            onUpdateBilgiler={(patch) => setBilgiler({ ...bilgiler, ...patch })}
            buHakedisImalatTutari={buHakedisImalatTutari}
            fiyatFarkiTutari={hesaplananFiyatFarki}
            toplamKesintiler={toplamKesintiler}
            netOdenecekTutar={netOdenecekTutar}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'yesil_defter' && (
          <YesilDefterMetraj
            kalemler={kalemler}
            onUpdateKalem={(id, patch) =>
              setKalemler(kalemler.map((k) => (k.id === id ? { ...k, ...patch } : k)))
            }
            onAddKalem={(kalem) => setKalemler([...kalemler, kalem])}
            onRemoveKalem={(id) => setKalemler(kalemler.filter((k) => k.id !== id))}
            onLoadFromActiveDosya={activeDosyaId ? handleLoadFromActiveDosya : undefined}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'fiyat_farki' && (
          <FiyatFarkiHesaplayici
            parametreler={fiyatFarki}
            onUpdateParametreler={(patch) => setFiyatFarki({ ...fiyatFarki, ...patch })}
            buHakedisImalatTutari={buHakedisImalatTutari}
            hesaplananFiyatFarki={hesaplananFiyatFarki}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'kesintiler' && (
          <KesintilerVeStopaj
            parametreler={kesintiler}
            onUpdateParametreler={(patch) => setKesintiler({ ...kesintiler, ...patch })}
            brutHakedisTutari={brutHakedisTutari}
            hesaplananStopaj={hesaplananStopaj}
            hesaplananDamga={hesaplananDamga}
            hesaplananKararPulu={hesaplananKararPulu}
            hesaplananKdv={hesaplananKdv}
            hesaplananKdvTevkifat={hesaplananKdvTevkifat}
            toplamKesintiler={toplamKesintiler}
            netOdenecekTutar={netOdenecekTutar}
            formatCurrency={formatCurrency}
            onAktarToOeb={handleAktarToOeb}
          />
        )}

        {activeTab === 'dizi_pusulasi' && (
          <DiziPusulasiVeImzalar
            bilgiler={bilgiler}
            buHakedisImalatTutari={buHakedisImalatTutari}
            fiyatFarkiTutari={hesaplananFiyatFarki}
            toplamKesintiler={toplamKesintiler}
            netOdenecekTutar={netOdenecekTutar}
            formatCurrency={formatCurrency}
            onPrintA4={handlePrintA4}
          />
        )}
      </div>
    </div>
  )
}
