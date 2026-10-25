import React from 'react'
import { Save, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { PozItem, PozFiyatGecmisi } from '../pozlar.hooks'
import { ORNEK_POZ_SABLONLARI } from '../yeni.constants'

interface YeniPozPreviewPanelProps {
  editId: number | null
  formData: Partial<PozItem>
  fiyatListesi: PozFiyatGecmisi[]
  isSaving: boolean
  handleApplyTemplate: (tpl: (typeof ORNEK_POZ_SABLONLARI)[0]) => void
}

export function YeniPozPreviewPanel({
  editId,
  formData,
  fiyatListesi,
  isSaving,
  handleApplyTemplate
}: YeniPozPreviewPanelProps): React.JSX.Element {
  return (
    <div className="lg:col-span-5 space-y-6">
      <div className="space-y-5 sticky top-6">
        {/* 1. KART: Pozu Detay Bilgileri */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="bg-[#f97316] text-white px-5 py-3 font-bold text-sm flex items-center justify-between">
            <span>
              {formData.poz_no
                ? `${formData.poz_no} Pozu Detay Bilgileri`
                : 'Poz Detay Bilgileri (Önizleme)'}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-extrabold tracking-wider">
              {formData.poz_kurumu || 'ÇŞB'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Poz No & Eski Poz No */}
            <div className="grid grid-cols-12 p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="col-span-4 font-bold text-slate-500">Poz No</div>
              <div className="col-span-8 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{formData.poz_no || '-'}</span>
                {formData.eski_poz_no && (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 text-[11px]">
                    Eski Poz No : {formData.eski_poz_no}
                  </span>
                )}
              </div>
            </div>

            {/* Tanım */}
            <div className="grid grid-cols-12 p-3.5">
              <div className="col-span-4 font-bold text-slate-500">Tanım</div>
              <div className="col-span-8 text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {formData.kalem_adi || formData.poz_tanimi || '-'}
              </div>
            </div>

            {/* Uzun Tanım */}
            <div className="grid grid-cols-12 p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="col-span-4 font-bold text-slate-500">Uzun Tanım</div>
              <div className="col-span-8 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {formData.ozelligi || formData.kalem_adi || formData.poz_tanimi || '-'}
              </div>
            </div>

            {/* Birim */}
            <div className="grid grid-cols-12 p-3.5">
              <div className="col-span-4 font-bold text-slate-500">Birim</div>
              <div className="col-span-8 font-bold font-mono text-slate-900 dark:text-white uppercase">
                {formData.birim || 'M3'}
              </div>
            </div>

            {/* Pozun Tipi */}
            <div className="grid grid-cols-12 p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="col-span-4 font-bold text-slate-500">Pozun Tipi</div>
              <div className="col-span-8 font-semibold text-slate-900 dark:text-white">
                {formData.poz_tipi || 'Analiz'}
              </div>
            </div>

            {/* Bulunduğu Kitap */}
            <div className="grid grid-cols-12 p-3.5">
              <div className="col-span-4 font-bold text-slate-500">Bulunduğu Kitap</div>
              <div className="col-span-8 font-semibold text-slate-900 dark:text-white">
                {formData.fasikul || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. KART: Pozu Birim Fiyatları */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="bg-[#f97316] text-white px-5 py-3 font-bold text-sm flex items-center justify-between">
            <span>
              {formData.poz_no
                ? `${formData.poz_no} Pozu Birim Fiyatları`
                : 'Poz Birim Fiyatları (Önizleme)'}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
              {fiyatListesi.length} Dönem
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="p-3 pl-4">Birim Fiyat Tarihi</th>
                  <th className="p-3 text-right pr-4">Birim Fiyatı (TL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {fiyatListesi.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-slate-400">
                      Henüz birim fiyat girilmedi.
                    </td>
                  </tr>
                ) : (
                  fiyatListesi.map((f, i) => (
                    <tr key={i} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/20">
                      <td className="p-3 pl-4 font-semibold text-slate-800 dark:text-slate-200">
                        {f.donem || '-'}
                      </td>
                      <td className="p-3 text-right pr-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(f.fiyat || 0).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        TL
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hızlı Şablonlar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Hazır Örnek Poz Şablonları</span>
          </span>
          <div className="space-y-1.5">
            {ORNEK_POZ_SABLONLARI.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    {tpl.baslik}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold">
                      {tpl.poz_no}
                    </span>
                    {tpl.eski_poz_no && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {tpl.eski_poz_no}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 block">
                  {tpl.kalem_adi}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Kaydet Butonu */}
        <Button
          type="submit"
          disabled={isSaving}
          className="w-full bg-[#f97316] hover:bg-orange-600 text-white gap-2 text-xs py-3 shadow-md font-bold cursor-pointer"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>{editId ? 'Değişiklikleri Kaydet' : 'Pozu & Fiyat Geçmişini Sisteme Ekle'}</span>
        </Button>
      </div>
    </div>
  )
}
