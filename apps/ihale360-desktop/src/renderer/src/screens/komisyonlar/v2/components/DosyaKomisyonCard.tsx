import React from 'react'
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  FileSearch,
  History,
  Sparkles,
  Zap
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import type { DosyaKomisyonItem } from '../types'

interface DosyaKomisyonCardProps {
  item: DosyaKomisyonItem
  onApplyTemplate: (dosyaId: number) => void
  onOpenCopyModal: (item: DosyaKomisyonItem) => void
  onOpenDetail: (item: DosyaKomisyonItem, tab: 'kadro' | 'revizyon') => void
}

export const DosyaKomisyonCard: React.FC<DosyaKomisyonCardProps> = ({
  item,
  onApplyTemplate,
  onOpenCopyModal,
  onOpenDetail
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Sol: Dosya Bilgileri */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
              {item.dosya_no}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {item.is_tanimi}
            </span>

            {/* Kadro Kaynak Rozeti */}
            {item.source === 'custom' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Dosyaya Özel Kadro
              </span>
            ) : item.source === 'template' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800 shadow-2xs">
                <Building2 className="w-3 h-3 text-amber-600" />
                Kurumsal Şablon (Varsayılan)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold border border-slate-300 dark:border-slate-700">
                Henüz Kadro Atanmadı
              </span>
            )}

            {item.history_count > 0 && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <History className="w-3 h-3" />
                {item.history_count} Revizyon
              </span>
            )}
          </div>

          {/* Şablon Mirası Uyarısı ve Hızlı Sabitleme */}
          {item.source === 'template' && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Bu dosya kurumsal şablon kadrosunu miras alıyor. Tek tıkla bu dosyaya özel bağımsız
                kadro olarak sabitleyebilirsiniz.
              </span>
              <button
                type="button"
                onClick={() => onApplyTemplate(item.id)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                ⚡ Dosyaya Özel Sabitle
              </button>
            </div>
          )}

          {/* Komisyon Görevlileri Izgarası */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-0.5">
            {/* 1. Piyasa Fiyat Araştırma Komisyonu */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileSearch className="w-3.5 h-3.5" /> Piyasa Fiyat Araştırması Görevlileri
                </span>
                <span className="font-mono font-bold text-slate-500">
                  {item.piyasaMembers.length} Personel
                </span>
              </div>
              {item.piyasaMembers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.piyasaMembers.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-bold">{m.ad_soyad}</span>
                      {m.gorev_adi && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({m.gorev_adi})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 italic font-medium">
                  Henüz görevli atanmadı.
                </span>
              )}
            </div>

            {/* 2. Muayene ve Kabul Komisyonu */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Muayene &amp; Kabul Komisyonu
                </span>
                <span className="font-mono font-bold text-slate-500">
                  {item.muayeneMembers.length} Personel
                </span>
              </div>
              {item.muayeneMembers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.muayeneMembers.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-bold">{m.ad_soyad}</span>
                      {m.gorev_adi && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({m.gorev_adi})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 italic font-medium">
                  Henüz görevli atanmadı.
                </span>
              )}
            </div>
          </div>

          {item.lastUpdate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono pt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Son Değişiklik:</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {new Date(item.lastUpdate).toLocaleString('tr-TR')}
              </span>
            </div>
          )}
        </div>

        {/* Sağ: Aksiyon Butonları */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-start pt-1 flex-wrap justify-end">
          {/* Başka Dosyadan Kopyala Butonu */}
          <button
            type="button"
            onClick={() => onOpenCopyModal(item)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Başka bir temin dosyasının komisyon kadrosunu bu dosyaya kopyala"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Dosyadan Kopyala</span>
          </button>

          {/* Revizyon Çizelgesi Butonu */}
          <button
            type="button"
            onClick={() => onOpenDetail(item, 'revizyon')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer shadow-2xs"
            title="Bu dosyadaki komisyon üye değişiklikleri geçmişini aç"
          >
            <History className="w-3.5 h-3.5" />
            <span>Revizyon Çizelgesi ({item.history_count})</span>
          </button>

          {/* Kadroyu Güncelle Butonu */}
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 rounded-xl px-3.5 py-2 shadow-xs cursor-pointer"
            onClick={() => onOpenDetail(item, 'kadro')}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Kadroyu Güncelle</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
