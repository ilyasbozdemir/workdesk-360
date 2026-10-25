import React from 'react'
import {
  Building,
  Users,
  Calendar,
  Hash,
  AlignLeft,
  Type,
  User,
  MapPin,
  ArrowLeft
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface BirimDetailProps {
  viewingBirim: any
  setViewingBirim: (birim: any) => void
  personeller: any[]
}

export const BirimDetail: React.FC<BirimDetailProps> = ({
  viewingBirim,
  setViewingBirim,
  personeller
}) => {
  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full">
      <Button
        variant="ghost"
        onClick={() => setViewingBirim(null)}
        className="w-fit mb-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Listeye Geri Dön
      </Button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-5 bg-blue-50/50 dark:bg-blue-950/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-200 dark:border-blue-800">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              {viewingBirim.birim_adi}
            </h2>
            <div className="text-sm text-slate-500 flex gap-4">
              {viewingBirim.personel_sayisi !== undefined && (
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Users className="w-4 h-4 text-blue-500" /> {viewingBirim.personel_sayisi}{' '}
                  Personel
                </span>
              )}
              {viewingBirim.created_at &&
                new Date(viewingBirim.created_at).getFullYear() > 2000 && (
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />{' '}
                    {new Date(viewingBirim.created_at).toLocaleDateString('tr-TR')}
                  </span>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Hash className="w-4 h-4 text-slate-400" /> e-Bütçe Kodu
            </span>
            <span className="font-mono text-base text-slate-800 dark:text-slate-200 font-semibold">
              {viewingBirim.e_butce || '-'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Hash className="w-4 h-4 text-slate-400" /> Say2000i Kodu
            </span>
            <span className="font-mono text-base text-slate-800 dark:text-slate-200 font-semibold">
              {viewingBirim.say2000i || '-'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Hash className="w-4 h-4 text-slate-400" /> DETSİS / DTVT Kodu
            </span>
            <span className="font-mono text-base text-slate-800 dark:text-slate-200 font-semibold">
              {viewingBirim.detsis_kodu || viewingBirim.dtvt_kodu || '-'}
            </span>
          </div>

          {viewingBirim.muhasebe_kodu && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Hash className="w-4 h-4 text-slate-400" /> Muhasebe Birim Kodu &amp; Adı
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-base text-slate-800 dark:text-slate-200 font-semibold">
                  {viewingBirim.muhasebe_kodu}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-slate-500">
                  {viewingBirim.muhasebe_adi || '-'}
                </span>
              </div>
            </div>
          )}

          {viewingBirim.harcama_kodu && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Hash className="w-4 h-4 text-slate-400" /> Harcama Birim Kodu &amp; Adı
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-base text-slate-800 dark:text-slate-200 font-semibold">
                  {viewingBirim.harcama_kodu}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-slate-500">
                  {viewingBirim.harcama_adi || '-'}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <AlignLeft className="w-4 h-4 text-slate-400" /> Sunum Makamı
            </span>
            <span className="text-sm text-slate-800 dark:text-slate-200">
              {viewingBirim.sunum_makami || '-'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Type className="w-4 h-4 text-slate-400" /> Antet Ek Satır
            </span>
            <span className="text-sm text-slate-800 dark:text-slate-200">
              {viewingBirim.antet_ek_satir || '-'}
            </span>
          </div>

          {(viewingBirim.ilgili_personel_id || viewingBirim.ayrintili_bilgi_personel) && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider mb-2">
                <User className="w-4 h-4 text-emerald-500" /> İlgili Personel
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {personeller.find((p) => p.id === viewingBirim.ilgili_personel_id)?.ad_soyad ||
                  viewingBirim.ayrintili_bilgi_personel}
              </span>
            </div>
          )}

          {viewingBirim.ihtiyac_yeri_eki &&
            viewingBirim.ihtiyac_yeri_eki !== '[]' &&
            viewingBirim.ihtiyac_yeri_eki !== '[""]' &&
            (() => {
              let items: string[] = []
              try {
                if (viewingBirim.ihtiyac_yeri_eki.startsWith('[')) {
                  const parsed = JSON.parse(viewingBirim.ihtiyac_yeri_eki)
                  if (Array.isArray(parsed)) {
                    items = parsed.map((s: any) => String(s || '').trim()).filter(Boolean)
                  }
                }
              } catch {}
              if (items.length === 0) {
                items = viewingBirim.ihtiyac_yeri_eki
                  .split('\n')
                  .map((y: string) => y.trim())
                  .filter(Boolean)
              }
              if (items.length === 0) return null

              return (
                <div className="col-span-full p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider mb-3">
                    <MapPin className="w-4 h-4 text-amber-500" /> İhtiyaç Yerleri
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map((yer: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 shadow-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                          {yer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
        </div>
      </div>
    </div>
  )
}
