import React, { useState } from 'react'
import { MifKayit, KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import {
  FileCheck2,
  Printer,
  ShieldCheck,
  Clock,
  CheckCircle,
  Search,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

interface MifOebTabProps {
  mifListesi: MifKayit[]
  onOpenOebModal: (mif: MifKayit) => void
  onMifDurumGuncelle: (mifId: string, yeniDurum: MifKayit['durum']) => void
  activeRole: KamuRole
}

export const MifOebTab: React.FC<MifOebTabProps> = ({
  mifListesi,
  onOpenOebModal,
  onMifDurumGuncelle,
  activeRole
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mifListesi.filter((m) => {
    const matchesSearch =
      m.alacakliUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alacakliVkn.includes(searchTerm) ||
      m.mifNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.dosyaNo && m.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || m.durum === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filtre ve Arama Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Alacaklı unvan, VKN, MİF No veya Dosya No ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="taslak">Taslak / İşlem Aşamasında</option>
            <option value="bloke_edildi">Ödenek Bloke Edildi</option>
            <option value="onaylandi">ÖEB Harcama Yetkilisince Onaylandı</option>
            <option value="muhasebeye_sevk">Muhasebeye Sevk Edildi</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Toplam <strong>{filtered.length}</strong> MİF & Ödeme Emri Belgesi listeleniyor
        </div>
      </div>

      {/* MİF ve Ödeme Emri Tablosu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">MİF No & Tarih</th>
                <th className="py-3 px-4">Alacaklı (Firma) / VKN</th>
                <th className="py-3 px-4">Bütçe Tertibi</th>
                <th className="py-3 px-4 text-right">Brüt Tutar</th>
                <th className="py-3 px-4 text-right">Yasal Kesintiler (DV+KDV)</th>
                <th className="py-3 px-4 text-right">Net Ödenecek</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.map((m) => {
                const totalKesinti =
                  m.damgaVergisiTutari + m.kararPuluTutari + m.kdvTevkifatTutari + m.digerKesintiler

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-extrabold text-blue-600 dark:text-blue-400">
                        {m.mifNo}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.tarih} {m.dosyaNo ? `| ${m.dosyaNo}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {m.alacakliUnvan}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        VKN: {m.alacakliVkn} | IBAN: {m.alacakliIban.slice(0, 10)}...
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="truncate max-w-[200px]" title={m.butceTertibi}>
                        {m.butceTertibi}
                      </div>
                      {m.tifNo && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ {m.tifNo}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(m.brutTutar)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      <div>-{formatCurrency(totalKesinti)}</div>
                      <div className="text-[10px] text-slate-400">
                        DV: {formatCurrency(m.damgaVergisiTutari)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(m.netOdenecekTutar)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.durum === 'onaylandi'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : m.durum === 'bloke_edildi'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                            : m.durum === 'muhasebeye_sevk'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {m.durum === 'onaylandi' && <CheckCircle size={10} />}
                        {m.durum === 'bloke_edildi' && <Clock size={10} />}
                        {m.durum === 'taslak' && <AlertCircle size={10} />}
                        {m.durum}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenOebModal(m)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-all cursor-pointer shadow-xs"
                          title="HMB Muhasebat GM Matbu A4 Ödeme Emri Belgesini Aç"
                        >
                          <Printer size={12} className="text-blue-500" />
                          <span>ÖEB Belgesi</span>
                        </button>

                        {/* ROL TABANLI İŞLEM BUTONLARI */}
                        {activeRole === 'harcama_yetkilisi' && m.durum !== 'onaylandi' && (
                          <button
                            type="button"
                            onClick={() => onMifDurumGuncelle(m.id, 'onaylandi')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                            title="Harcama Yetkilisi Olarak E-İmza ile Ödeme Emrini Onayla"
                          >
                            <ShieldCheck size={12} />
                            <span>Onayla</span>
                          </button>
                        )}

                        {activeRole === 'mali_hizmetler' && m.durum === 'taslak' && (
                          <button
                            type="button"
                            onClick={() => onMifDurumGuncelle(m.id, 'bloke_edildi')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs"
                            title="Bütçe Ödeneğini Bloke Et ve Muayeneye Sevk Et"
                          >
                            <Clock size={12} />
                            <span>Ödenek Bloke</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

