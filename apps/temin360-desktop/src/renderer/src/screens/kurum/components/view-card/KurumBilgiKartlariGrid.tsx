import React from 'react'
import { Landmark, Sliders, MapPin, ShieldCheck, Phone, Mail, Copy, Check } from 'lucide-react'
import { KurumVerisi } from '../../kurum.hooks'

interface KurumBilgiKartlariGridProps {
  data: Partial<KurumVerisi>
  copiedField: string | null
  onCopy: (text: string | undefined, fieldKey: string) => void
}

export const KurumBilgiKartlariGrid: React.FC<KurumBilgiKartlariGridProps> = ({
  data,
  copiedField,
  onCopy
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KART 0: En Üst Yönetici / Kurum Başkanı & Harcama Yetkilisi */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            Üst Yönetici & Makam
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            Yetkili
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Kurum / Belediye Başkanı
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate mt-0.5">
              {data.kurum_baskani || '—'}
            </span>
            {data.baskan_unvani && (
              <span className="text-[10px] text-slate-500 block truncate font-medium">
                {data.baskan_unvani}
              </span>
            )}
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Varsayılan Harcama Yetkilisi
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate mt-0.5">
              {data.harcama_yetkilisi || '—'}
            </span>
          </div>

          {data.makam_adi && (
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Muhatap Makam
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block truncate mt-0.5">
                {data.makam_adi}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KART 1: Kurum Tipi & Mevzuat Şablonu */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            Mevzuat & Bütçeleme
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            KİK 4734
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <span className="text-slate-500 font-medium">Bütçeleme Tipi:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
              {data.kurum_tipi || 'Genel Bütçe'}
            </span>
          </div>

          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <span className="text-slate-500 font-medium">Finansman Kodu:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50">
              {data.finansman_kodu || '5'}
            </span>
          </div>

          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <span className="text-slate-500 font-medium">22/d Limit Sınırı:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
              {data.limit_tipi === 'buyuksehir' ? 'Büyükşehir Sınırları' : 'Diğer İdareler'}
            </span>
          </div>
        </div>
      </div>

      {/* KART 2: İletişim, Konum & Hızlı Kopyalama */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            İletişim & Konum
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            Tebligat
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {data.adres ? `${data.adres}, ` : ''}
              {data.ilce ? `${data.ilce} / ` : ''}
              {data.il || <span className="text-slate-400 italic">Adres girilmedi</span>}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => onCopy(data.telefon, 'telefon')}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-emerald-400 transition-colors group"
              title="Kopyalamak için tıklayın"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{data.telefon || '—'}</span>
              </div>
              {copiedField === 'telefon' ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </div>

            <div
              onClick={() => onCopy(data.eposta, 'eposta')}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-emerald-400 transition-colors group"
              title="Kopyalamak için tıklayın"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-[11px]">{data.eposta || '—'}</span>
              </div>
              {copiedField === 'eposta' ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KART 3: Resmi Kodlar & Entegrasyonlar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs md:col-span-2 lg:col-span-1 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-500" />
            Resmi Entegrasyon Kodları
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            e-Maliye
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div
            onClick={() => onCopy(data.detsis_kodu || data.dtvt_kodu, 'detsis')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 cursor-pointer hover:border-violet-400 transition-colors group"
            title="Kopyalamak için tıklayın"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">DETSİS Kodu</span>
              {copiedField === 'detsis' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
              )}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 text-xs truncate">
              {data.detsis_kodu || data.dtvt_kodu || '—'}
            </div>
          </div>

          <div
            onClick={() => onCopy(data.ebutce_kodu, 'ebutce')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 cursor-pointer hover:border-violet-400 transition-colors group"
            title="Kopyalamak için tıklayın"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">e-Bütçe Kodu</span>
              {copiedField === 'ebutce' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
              )}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 text-xs truncate">
              {data.ebutce_kodu || '—'}
            </div>
          </div>

          <div
            onClick={() => onCopy(data.say2000i_kodu, 'say2000i')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 cursor-pointer hover:border-violet-400 transition-colors group"
            title="Kopyalamak için tıklayın"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Say2000i</span>
              {copiedField === 'say2000i' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
              )}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 text-xs truncate">
              {data.say2000i_kodu || '—'}
            </div>
          </div>

          <div
            onClick={() => onCopy(data.harcama_birim_kodu, 'harcama')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 cursor-pointer hover:border-violet-400 transition-colors group"
            title="Kopyalamak için tıklayın"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Harcama Kodu</span>
              {copiedField === 'harcama' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
              )}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 text-xs truncate">
              {data.harcama_birim_kodu || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
