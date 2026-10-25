import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Compass,
  Hammer,
  Package,
  Truck,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Landmark,
  Receipt,
  ShieldCheck
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface HarcamaMerkeziWizardProps {
  activeLimit: number
  formatCurrency: (val: number) => string
}

export const HarcamaMerkeziWizard: React.FC<HarcamaMerkeziWizardProps> = ({
  activeLimit,
  formatCurrency
}) => {
  const [wizardStep, setWizardStep] = useState<number>(0)
  const [wizardSelection, setWizardSelection] = useState<{
    kategori?: 'yapim' | 'mal' | 'hizmet' | 'danismanlik'
    alimTuru?: 'dogrudan_temin' | 'ihale' | 'hakedis'
    butce?: 'limit_alti' | 'limit_ustu'
  }>({})

  return (
    <div className="space-y-6">
      {/* 3. İLLER BANKASI & SAYIŞTAY DENETİM KRİTERLERİ BİLGİ PANELİ */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                İller Bankası (İLBANK) &amp; Sayıştay Hakediş Güvencesi
              </h3>
              <p className="text-xs text-slate-400">
                Neden hakediş ve harcama evrakları bu kadar katı kurallara bağlıdır?
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            5018 Sayılı Kamu Mali Yönetimi Kanunu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> 1. Şahsi Zimmet &amp; Mali Sorumluluk
            </h4>
            <p className="text-slate-300 leading-relaxed">
              İller Bankası mühendisleri ve belediye harcama yetkilileri, imzalanan hakedişlerdeki
              her kuruştan şahsi mal varlıklarıyla sorumludur. Eksik pursantaj veya hatalı yeşil
              defter doğrudan <strong>kamu zararı</strong> sayılır.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> 2. Dizi Pusulası &amp; Kesinti Zinciri
            </h4>
            <p className="text-slate-300 leading-relaxed">
              SGK Borcu Yoktur, Vergi Borcu Yoktur, %5 Stopaj Kesintisi ve Damga Vergisi kesintisi
              olmadan hakediş vezneden çıkamaz. Sistem bu kesintileri kuruşu kuruşuna otomatik
              yapar.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 3. Laboratuvar &amp; Deney Onayı
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Beton kırım raporları, boru sızdırmazlık testleri ve şantiye ataşman defterleri
              hakedişin ayrılmaz ekidir. TEMİN 360 dizi pusulasında tüm ekleri eksiksiz
              numaralandırır.
            </p>
          </div>
        </div>
      </div>

      {/* 4. AKILLI SÜREÇ SİHİRBAZI */}
      <div className="p-6 md:p-8 rounded-3xl bg-linear-to-br from-indigo-50/70 via-white to-blue-50/70 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Akıllı Süreç &amp; İhale Türü Seçim Rehberi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Yapacağınız harcama veya hakedişin hangi kategoriye girdiğinden emin değil misiniz?
                Birkaç adımda öğrenin.
              </p>
            </div>
          </div>
          {wizardStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWizardStep(0)
                setWizardSelection({})
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Yeniden Başlat
            </Button>
          )}
        </div>

        {/* Wizard Steps */}
        {wizardStep === 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              1. Adım: Yapılacak işin ana niteliği nedir?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  setWizardSelection((prev) => ({
                    ...prev,
                    kategori: 'yapim'
                  }))
                  setWizardStep(1)
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
              >
                <Hammer className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  İnşaat, Onarım, Tesis veya Altyapı
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Bina, asfalt, kilit parke, kanalizasyon, tadilat veya tesis yapımı.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWizardSelection((prev) => ({ ...prev, kategori: 'mal' }))
                  setWizardStep(1)
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <Package className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Malzeme, Teçhizat veya Ürün Satın Alma
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Kırtasiye, akaryakıt, yedek parça, çimento, boru, bilgisayar vb.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWizardSelection((prev) => ({
                    ...prev,
                    kategori: 'hizmet'
                  }))
                  setWizardStep(1)
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
              >
                <Truck className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Hizmet, İşçilik veya Araç Kiralama
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Personel, temizlik, güvenlik, araç kiralama, bakım ve danışmanlık.
                </p>
              </button>
            </div>
          </div>
        )}

        {wizardStep === 1 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              2. Adım: Tahmini bütçe ve ödeme modeli nasıl olacak?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setWizardSelection((prev) => ({
                    ...prev,
                    butce: 'limit_alti',
                    alimTuru: 'dogrudan_temin'
                  }))
                  setWizardStep(2)
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer"
              >
                <FileCheck className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Doğrudan Temin Limiti Altında ({formatCurrency(activeLimit)})
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  KİK 22/d maddesi uyarınca komisyonsuz, hızlı onay belgesi ve piyasa araştırması
                  ile tek seferlik alım.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWizardSelection((prev) => ({
                    ...prev,
                    butce: 'limit_ustu',
                    alimTuru: 'hakedis'
                  }))
                  setWizardStep(2)
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
              >
                <Hammer className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Sözleşmeli / İhaleli veya Aylık Hak Ediş Süreci
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Pursantaj tablosu, hakediş icmali, fiyat farkı ve Sayıştay denetim kapakları
                  gerektiren taksitli süreç.
                </p>
              </button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Önerilen Süreç ve Evrak Seti Belirlendi
            </div>

            <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {wizardSelection.kategori === 'yapim' && wizardSelection.alimTuru === 'hakedis'
                ? '🏗️ Anahtar Teslimi / Birim Fiyatlı Yapım İşi Hakediş Süreci'
                : wizardSelection.kategori === 'mal'
                  ? '📦 Mal Alımı Muayene Kabul ve Taşınır Kayıt (TİF) Süreci'
                  : wizardSelection.kategori === 'hizmet'
                    ? '📋 Hizmet Alımı Puantaj & SGK Kontrollü Aylık Hakediş Süreci'
                    : '⚡ 4734 Sayılı KİK 22/d Doğrudan Temin Alım Süreci'}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Seçtiğiniz parametrelere göre sistem arka planda gerekli mevzuat şablonlarını, dizi
              pusulası fihristini ve onay mercilerini otomatik hazırlayacaktır.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to={wizardSelection.alimTuru === 'dogrudan_temin' ? '/dosyalar/yeni' : '/hakedis'}
              >
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
                  Bu Süreçle Dosya Oluştur
                  {wizardSelection.alimTuru !== 'dogrudan_temin' && (
                    <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      BETA
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setWizardStep(0)
                  setWizardSelection({})
                }}
                className="text-xs border-slate-300 dark:border-slate-700"
              >
                Farklı Bir Seçim Yap
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
