import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Gavel,
  Scale,
  Calculator,
  Package,
  Truck,
  Hammer,
  Info,
  ArrowRight,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'

interface HarcamaMerkeziSimulatorProps {
  simulatedBudget: number
  setSimulatedBudget: (val: number) => void
  simulatedWorkType: 'mal' | 'hizmet' | 'yapim'
  setSimulatedWorkType: (val: 'mal' | 'hizmet' | 'yapim') => void
  activeLimit: number
  formatCurrency: (val: number) => string
}

export const HarcamaMerkeziSimulator: React.FC<HarcamaMerkeziSimulatorProps> = ({
  simulatedBudget,
  setSimulatedBudget,
  simulatedWorkType,
  setSimulatedWorkType,
  activeLimit,
  formatCurrency
}) => {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 text-white space-y-6 shadow-2xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-black text-white">
                4734 Sayılı Kamu İhale Kanunu: İhale Usulü ve Bütçe Karar Matrisi
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Madde 18 - 22 &amp; 62/ı
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Bütçe tutarınıza göre Açık İhale mi, Pazarlık Usulü mü yoksa Doğrudan Temin mi
              uygulanacağını anında tespit edin.
            </p>
          </div>
        </div>
        <Link to="/mevzuat">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-400/40 text-indigo-200 hover:bg-indigo-950 text-xs font-semibold"
          >
            <Scale className="w-3.5 h-3.5 mr-1 text-amber-400" /> KİK Tebliği ve Eşik Değerler
          </Button>
        </Link>
      </div>

      {/* LIVE BUDGET CALCULATOR & DECISION BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Input & Selection */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/20 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" /> Tahmini Alım / Hakediş Bütçesi
                (TL)
              </label>
              <span className="text-[10px] font-mono text-slate-400">KDV Hariç</span>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={simulatedBudget}
                onChange={(e) => setSimulatedBudget(Number(e.target.value) || 0)}
                className="text-base font-mono font-bold bg-slate-900 border-indigo-500/40 text-white pl-4 pr-12 h-11"
                placeholder="Örn: 500000"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400">
                TL
              </span>
            </div>

            {/* Work Type Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                İş / Alım Türü:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mal', label: 'Mal Alımı', icon: Package },
                  { id: 'hizmet', label: 'Hizmet Alımı', icon: Truck },
                  { id: 'yapim', label: 'Yapım İşi', icon: Hammer }
                ].map((t) => {
                  const TIcon = t.icon
                  const isSelected = simulatedWorkType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSimulatedWorkType(t.id as 'mal' | 'hizmet' | 'yapim')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <TIcon className="w-4 h-4" />
                      <span className="text-[11px] font-bold">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400">Hızlı Değerler:</span>
              {[
                { label: '250 Bin', val: 250000 },
                { label: 'Limit (~1M)', val: activeLimit },
                { label: '2.5 Milyon', val: 2500000 },
                { label: '15 Milyon', val: 15000000 }
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSimulatedBudget(p.val)}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-indigo-900 border border-slate-800 text-[10px] font-mono text-slate-300 cursor-pointer transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Kurumunuz için geçerli tekil 22/d KİK limiti:
              <strong className="text-white ml-1 font-mono">{formatCurrency(activeLimit)}</strong>
            </span>
          </div>
        </div>

        {/* Right: Real-time Analysis & Statutory Path */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-950/90 border border-indigo-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Mevzuat Analiz Sonucu
              </span>
              <span className="font-mono text-xs font-bold text-amber-400">
                Hesaplanan Tutar: {formatCurrency(simulatedBudget)}
              </span>
            </div>

            {/* Decision Result Banner */}
            {simulatedBudget <= activeLimit ? (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ⚡ KİK Madde 22/d: DOĞRUDAN TEMİN LİMİTİ DAHİLİNDE
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Bu alım ihale açılmaksızın doğrudan temin usulüyle yapılabilir.
                </h4>
                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  İlan ve teminat alma zorunluluğu yoktur. İhale komisyonu kurulması zorunlu
                  değildir; harcama yetkilisince görevlendirilecek personel piyasa fiyat araştırması
                  yaparak onay belgesi düzenleyebilir.
                </p>
              </div>
            ) : simulatedBudget <= activeLimit * 2 ? (
              <div className="mt-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ⚖️ KİK Madde 21/f veya Madde 19: PAZARLIK / AÇIK İHALE
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Doğrudan temin limiti aşılmıştır. İhale usulü zorunludur!
                </h4>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Bu tutar tek seferde doğrudan teminle karşılanamaz. KİK Md. 21/f pazarlık usulü
                  (ilan yapılmaksızın en az 3 istekli davetiyle) veya Md. 19 Açık İhale usulü tercih
                  edilmelidir. İhale komisyonu ve %6 kesin teminat şarttır.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    🏛️ KİK Madde 19: AÇIK İHALE USULÜ ZORUNLUDUR
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Yüksek tutarlı alım: EKAP üzerinden Açık İhale ilanı zorunludur.
                </h4>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Tüm isteklilere açık EKAP ilanı verilmeli, kanuni ilan askı süreleri (14/21/40
                  gün) beklenmeli, %3 geçici teminat ve %6 kesin teminat tahsil edilmelidir.
                </p>
              </div>
            )}

            {/* Comparison Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EKAP İlanı:</span>
                <strong className="text-white">
                  {simulatedBudget <= activeLimit ? '❌ Aranmaz' : '✅ Zorunlu'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Teminat:</span>
                <strong className="text-white">
                  {simulatedBudget <= activeLimit ? '❌ Aranmaz' : '✅ %6 Kesin Teminat'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">İhale Komisyonu:</span>
                <strong className="text-white">
                  {simulatedBudget <= activeLimit ? '❌ İsteğe Bağlı' : '✅ Zorunlu'}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Hakediş / İcmal:</span>
                <strong className="text-white">
                  {simulatedWorkType === 'yapim' || simulatedBudget > activeLimit
                    ? '✅ Zorunlu'
                    : '📄 Fatura / TİF'}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Kanun Referansı: <strong>4734 Sayılı KİK Madde 18-22</strong>
            </span>
            <Link to={simulatedBudget <= activeLimit ? '/dosyalar/yeni' : '/hakedis'}>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-4 rounded-xl cursor-pointer flex items-center gap-1">
                {simulatedBudget <= activeLimit ? (
                  'Doğrudan Temin Başlat'
                ) : (
                  <>
                    İhale Modülü{' '}
                    <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30 ml-1">
                      BETA
                    </span>
                  </>
                )}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* SAYIŞTAY VE KİK KRİTİK DENETİM KURALLARI (MADDE 5 & 62/ı) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-500/20">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/30 space-y-1.5">
          <h4 className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> KİK Madde 5: Kısımlara Bölme Yasağı
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Eşik değerlerin altında kalmak veya 22/d doğrudan temin limitini aşmamak amacıyla{' '}
            <strong>aynı nitelikteki bir iş parçalara bölünerek</strong> ayrı ayrı doğrudan teminle
            yapılamaz. Sayıştay denetimlerinde en çok zimmet çıkan konudur.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-1.5">
          <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" /> KİK Madde 62/ı: %10 Bütçe Sınırı Kuralı
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            İdarelerin 21/f (pazarlık) ve 22/d (doğrudan temin) ile yapacakları harcamaların
            toplamı, o yılki toplam mal/hizmet bütçelerinin <strong>%10&apos;unu aşamaz</strong>.
            Aşılması durumunda önceden Kamu İhale Kurulu&apos;ndan (KİK) izin alınması zorunludur.
          </p>
        </div>
      </div>
    </div>
  )
}
