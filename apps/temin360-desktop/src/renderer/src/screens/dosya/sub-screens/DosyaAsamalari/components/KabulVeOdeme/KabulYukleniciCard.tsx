import React from 'react'
import { Banknote, Calendar, CheckCircle2, FileCheck, FilePlus2, FileSpreadsheet, FileText, Receipt, Trophy, Users } from 'lucide-react'
import { Button } from '../../../../../../components/ui/Button'
import { FirmaStats } from './types'

interface KabulYukleniciCardProps {
  kazananFirmaUnvan: string
  firmaStats: FirmaStats
  alimTuru?: 'mal' | 'hizmet' | 'yapim'
  isMal?: boolean
  isHizmet?: boolean
  isYapim?: boolean
  formatCurrency: (val: number | null) => string
  formatDate: (dateStr: string | null) => string
  onOpenAddTutanak?: () => void
  onOpenPreview?: (sablonKey: string) => void
  onOpenKomisyonModal?: () => void
}

export function KabulYukleniciCard({
  kazananFirmaUnvan,
  firmaStats,
  alimTuru = 'mal',
  isMal = true,
  isHizmet = false,
  isYapim = false,
  formatCurrency,
  formatDate,
  onOpenAddTutanak,
  onOpenPreview,
  onOpenKomisyonModal
}: KabulYukleniciCardProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Kart Başlığı - Referans Tasarım: Pembe/Kırmızımsı Vurgulu Yumuşak Başlık */}
      <div className="bg-rose-50/80 dark:bg-rose-950/20 px-5 py-3 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Bu İhaleye Ait Kazanan Firmalar</span>
        </h3>
        <span className="text-[11px] font-semibold text-rose-700/80 dark:text-rose-400/80">
          {isYapim ? 'Yapım İşi Yüklenicisi' : isHizmet ? 'Hizmet Yüklenicisi' : 'Mal Tedarikçisi'}
        </span>
      </div>

      {/* Tablo Yapısı */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-5">Firma</th>
              <th className="py-2.5 px-5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              {/* Firma Bilgisi */}
              <td className="py-4 px-5">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  {kazananFirmaUnvan || 'İstekli / Yüklenici Firma'}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  {firmaStats?.teklifToplami != null && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <Banknote className="w-3.5 h-3.5" />
                      Sözleşme / Teklif Tutarı: {formatCurrency(firmaStats.teklifToplami)}
                    </span>
                  )}
                  {firmaStats?.teslimTarihi && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Teslim Tarihi: {formatDate(firmaStats.teslimTarihi)}
                    </span>
                  )}
                </div>
              </td>

              {/* İşlemler */}
              <td className="py-4 px-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {/* 1. Mal Alımı için Mal Kabul Tutanağı Ekle */}
                  {isMal && onOpenAddTutanak && (
                    <Button
                      onClick={onOpenAddTutanak}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Yeni Mal Kabul Tutanağı Ekle"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      <span>Mal Kabul Tutanağı Ekle</span>
                    </Button>
                  )}

                  {/* 2. Hizmet Alımı için Butonlar */}
                  {isHizmet && (
                    <>
                      {onOpenPreview && (
                        <Button
                          onClick={() => onOpenPreview('hizmet-isleri-kabul-teklif-belgesi')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Hizmet İşleri Kabul Teklif Belgesi Önizleme"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Hizmet İşleri Kabul Teklif Belgesi</span>
                        </Button>
                      )}
                      {onOpenAddTutanak && (
                        <Button
                          onClick={onOpenAddTutanak}
                          size="sm"
                          className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Hizmet İşleri Kabul Tutanağı Ekle"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          <span>Hizmet İşleri Kabul Tutanağı</span>
                        </Button>
                      )}
                    </>
                  )}

                  {/* 3. Yapım İşi için Butonlar */}
                  {isYapim && onOpenAddTutanak && (
                    <>
                      <Button
                        onClick={onOpenAddTutanak}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Geçici Kabul Tutanağı Ekle (KİK049)"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                        <span>Geçici Kabul Tutanağı Ekle</span>
                      </Button>
                      <Button
                        onClick={onOpenAddTutanak}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Kesin Kabul Tutanağı Ekle (KİK051)"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                        <span>Kesin Kabul Tutanağı Ekle</span>
                      </Button>
                    </>
                  )}

                  {/* 4. Ödeme Yazısı Butonu */}
                  {onOpenPreview && (
                    <Button
                      onClick={() => onOpenPreview('odeme-yazisi')}
                      size="sm"
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-8 px-3.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Bu Firma İçin Ödeme Yazısı / Ödeme Emri Belgesi Çıkar"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ödeme Yazısı</span>
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
