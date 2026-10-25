import React from 'react'
import { Building2, CheckCircle2, FileSearch, Zap } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import type { DosyaKomisyonMember } from '../types'

interface KurumsalSablonTabProps {
  piyasaDefaults: DosyaKomisyonMember[]
  muayeneDefaults: DosyaKomisyonMember[]
  onEditKomisyon: (kom: { id: number; ad: string }) => void
}

export const KurumsalSablonTab: React.FC<KurumsalSablonTabProps> = ({
  piyasaDefaults,
  muayeneDefaults,
  onEditKomisyon
}) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
      {/* Kurumsal Şablon Açıklama Kutusu */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
            Kurumsal Genel Komisyon Şablonları Havuzu
          </h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Bu bölümde tanımlanan personel kadroları, kurumunuzun doğrudan temin ve ihale süreçleri
          için <strong>genel şablon havuzudur</strong>. Yeni bir temin dosyası açıldığında veya bir
          dosyada <em>&quot;Kurumsal Şablonu Aktar&quot;</em> işlemi yapıldığında bu kadro
          varsayılan olarak dosyaya kopyalanır. Bir dosyada yapılan özel değişiklikler buradaki
          şablon kadrosunu asla bozmaz.
        </p>
      </div>

      {/* Şablon Kartları Izgarası */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Piyasa Fiyat Araştırma Şablonu */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileSearch className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  Piyasa Fiyat Araştırması Şablon Kadrosu
                </h4>
                <span className="text-[11px] text-slate-500">
                  Doğrudan temin fiyat araştırmasında görev alacak varsayılan personel
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditKomisyon({ id: 1, ad: 'Piyasa Fiyat Araştırması' })}
              className="text-xs font-bold gap-1 rounded-xl cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Şablonu Düzenle</span>
            </Button>
          </div>

          {/* Üyeler */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Şablon Görevlileri ({piyasaDefaults.length})
            </span>
            {piyasaDefaults.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                Şablonda henüz tanımlı görevli bulunmuyor.
              </p>
            ) : (
              <div className="space-y-1.5">
                {piyasaDefaults.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {m.ad_soyad}
                      </span>
                      {m.unvan && <span className="text-slate-400 ml-1.5">({m.unvan})</span>}
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                      {m.gorev_adi || 'Üye'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Muayene ve Kabul Şablonu */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  Muayene ve Kabul Komisyonu Şablon Kadrosu
                </h4>
                <span className="text-[11px] text-slate-500">
                  Muayene kabul ve teslim alma süreçlerinde varsayılan heyet
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditKomisyon({ id: 2, ad: 'Muayene ve Kabul Komisyonu' })}
              className="text-xs font-bold gap-1 rounded-xl cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Şablonu Düzenle</span>
            </Button>
          </div>

          {/* Üyeler */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Şablon Görevlileri ({muayeneDefaults.length})
            </span>
            {muayeneDefaults.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                Şablonda henüz tanımlı görevli bulunmuyor.
              </p>
            ) : (
              <div className="space-y-1.5">
                {muayeneDefaults.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {m.ad_soyad}
                      </span>
                      {m.unvan && <span className="text-slate-400 ml-1.5">({m.unvan})</span>}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                      {m.gorev_adi || 'Üye'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
