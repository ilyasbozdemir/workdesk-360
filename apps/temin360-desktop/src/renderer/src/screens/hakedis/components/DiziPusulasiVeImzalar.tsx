import React from 'react'
import {
  FileText,
  Printer,
  FileCheck,
  UserCheck,
  Download,
  Building,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { HakedisBilgileri } from '../types'

interface DiziPusulasiVeImzalarProps {
  bilgiler: HakedisBilgileri
  buHakedisImalatTutari: number
  fiyatFarkiTutari: number
  toplamKesintiler: number
  netOdenecekTutar: number
  formatCurrency: (val: number) => string
  onPrintA4: () => void
}

export const DiziPusulasiVeImzalar: React.FC<DiziPusulasiVeImzalarProps> = ({
  bilgiler,
  buHakedisImalatTutari,
  fiyatFarkiTutari,
  toplamKesintiler,
  netOdenecekTutar,
  formatCurrency,
  onPrintA4
}) => {
  const evraklar = [
    { no: 1, evrak: 'Hakediş Ön Kapağı ve İcmal Cetveli', durum: 'Mevcut', sayfa: 1 },
    { no: 2, evrak: 'Yeşil Defter ve İmalat Metraj Sayfaları', durum: 'Mevcut', sayfa: '1-3' },
    {
      no: 3,
      evrak: '4734 Sayılı Kanun Madde 8 Fiyat Farkı Hesabı Cetveli',
      durum: fiyatFarkiTutari > 0 ? 'Mevcut' : 'Uygulanmadı',
      sayfa: fiyatFarkiTutari > 0 ? 1 : '-'
    },
    { no: 4, evrak: 'Hakediş Kesinti ve Stopaj Cetveli', durum: 'Mevcut', sayfa: 1 },
    { no: 5, evrak: 'Yüklenici Hakediş Faturası / E-Arşiv Fatura', durum: 'Eklenecek', sayfa: 1 },
    {
      no: 6,
      evrak: 'SGK İlişiksizlik / Borcu Yoktur Belgesi',
      durum: 'Kontrol Edildi',
      sayfa: 1
    },
    {
      no: 7,
      evrak: 'Vergi Dairesi Borcu Yoktur Yazısı (6183 m. 22/A)',
      durum: 'Kontrol Edildi',
      sayfa: 1
    },
    {
      no: 8,
      evrak: 'Muayene ve Kabul Komisyonu Tutanağı (TİF Onayı)',
      durum: 'Onaylandı',
      sayfa: 1
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Üst Eylem Barı */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileCheck size={18} className="text-blue-500" />
            Hakediş Dizi Pusulası ve İmza Heyeti Onayı
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sayıştay ve Mali Hizmetler Birimi İncelemesine Sunulacak Resmî Hakediş Dosyası İmzaları
          </p>
        </div>

        <button
          type="button"
          onClick={onPrintA4}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md hover:scale-[1.02] cursor-pointer"
        >
          <Printer size={15} />
          <span>Resmî Hakediş Raporunu Yazdır (A4)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dizi Pusulası Tablosu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Hakediş Dosyası Dizi Pusulası (Ekli Belgeler)
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 font-bold">
                <th className="py-2 px-3 w-10 text-center">No</th>
                <th className="py-2 px-3">Belge Adı</th>
                <th className="py-2 px-3 w-28 text-center">Durum</th>
                <th className="py-2 px-3 w-16 text-center">Sayfa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {evraklar.map((evrak) => (
                <tr key={evrak.no} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-center font-mono text-slate-400">{evrak.no}</td>
                  <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{evrak.evrak}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {evrak.durum}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{evrak.sayfa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resmî İmza Heyeti Blokları */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <UserCheck size={16} className="text-emerald-500" />
              Yetkili Onay ve İmza Heyeti (5018 / 4734)
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">Yüklenici Firma</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {bilgiler.yukleniciFirma || 'Yetkili Şantiye Şefi'}
                </div>
                <div className="text-[10px] text-slate-400">Kaşe / Islak / E-İmza</div>
                <div className="h-6 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Kontrol Teşkilatı
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Kontrol Mühendisi
                </div>
                <div className="text-[10px] text-slate-400">Metraj ve İmalat Uygunluğu</div>
                <div className="h-6 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Gerçekleştirme Görevlisi
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Mali Kontrolör</div>
                <div className="text-[10px] text-slate-400">5018 m. 33 Mali İnceleme</div>
                <div className="h-6 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Harcama Yetkilisi
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Birim Amiri</div>
                <div className="text-[10px] text-slate-400">Harcama ve Ödeme Talimatı</div>
                <div className="h-6 border-b border-dashed border-slate-300 dark:border-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
