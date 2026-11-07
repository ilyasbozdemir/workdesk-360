import React, { useRef } from 'react'
import { MifKayit } from '../../types'
import { formatCurrency, amountToWordsTL } from '@renderer/utils/formatters'
import { Printer, X, ShieldCheck } from 'lucide-react'

interface OebMatbuModalProps {
  mif: MifKayit | null
  onClose: () => void
  institutionName?: string
}

export const OebMatbuModal: React.FC<OebMatbuModalProps> = ({
  mif,
  onClose,
  institutionName = 'T.C. KAMU İDARESİ'
}) => {
  const printRef = useRef<HTMLDivElement>(null)

  if (!mif) return null

  const handlePrint = () => {
    window.print()
  }

  const totalKesinti =
    mif.damgaVergisiTutari + mif.kararPuluTutari + mif.kdvTevkifatTutari + mif.digerKesintiler

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER (Print esnasında gizli) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Resmî Ödeme Emri Belgesi (ÖEB) & MİF Çıktısı
              </h2>
              <p className="text-[11px] text-slate-500">
                Hazine ve Maliye Bakanlığı Muhasebat Genel Müdürlüğü Formatında Matbu Form
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              <span>Yazdır / PDF Olarak Kaydet</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (RESMÎ A4 ÖEB ÇIKTISI) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100/60 dark:bg-slate-950/60 flex justify-center print:p-0 print:bg-white">
          <div
            ref={printRef}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-12 shadow-md border border-slate-300 font-serif text-[11px] leading-relaxed flex flex-col justify-between print:shadow-none print:border-none print:p-8"
          >
            <div>
              {/* Resmî Başlık Anteti */}
              <div className="text-center pb-4 border-b-2 border-black space-y-1">
                <h1 className="text-sm font-bold uppercase tracking-wider">{institutionName}</h1>
                <h2 className="text-xs font-extrabold uppercase">
                  ÖDEME EMRİ BELGESİ (MİF - MUHASEBE İŞLEM FİŞİ)
                </h2>
                <p className="text-[9px] text-slate-600 italic">
                  5018 Sayılı Kamu Mali Yönetimi ve Kontrol Kanunu (Madde 31, 32 ve 33)
                </p>
              </div>

              {/* Temel Bilgiler Tablosu */}
              <div className="grid grid-cols-2 gap-4 my-4 pb-4 border-b border-black text-xs">
                <div className="space-y-1 font-sans">
                  <div>
                    <strong>Bütçe Yılı:</strong> 2026
                  </div>
                  <div>
                    <strong>MİF / Belge No:</strong> {mif.mifNo}
                  </div>
                  <div>
                    <strong>Tarih:</strong> {mif.tarih}
                  </div>
                  <div>
                    <strong>İlgili Dosya No:</strong> {mif.dosyaNo || 'Doğrudan Temin'}
                  </div>
                  {mif.tifNo && (
                    <div>
                      <strong>Taşınır İşlem Fişi (TİF):</strong> {mif.tifNo}
                    </div>
                  )}
                </div>

                <div className="space-y-1 font-sans">
                  <div>
                    <strong>Alacaklı / Hak Sahibi:</strong> {mif.alacakliUnvan}
                  </div>
                  <div>
                    <strong>VKN / TCKN:</strong> {mif.alacakliVkn}
                  </div>
                  <div>
                    <strong>IBAN:</strong> {mif.alacakliIban}
                  </div>
                  <div>
                    <strong>Fatura No / Tarih:</strong> {mif.faturaNo} ({mif.faturaTarihi})
                  </div>
                </div>
              </div>

              {/* Bütçe Tertibi ve Tahakkuk */}
              <div className="my-4">
                <h3 className="font-sans font-bold text-xs uppercase mb-2">1. Bütçe Tertibi Dağılımı</h3>
                <table className="w-full border-collapse border border-black font-sans text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-1.5">Bütçe Tertibi</th>
                      <th className="border border-black p-1.5">Açıklama</th>
                      <th className="border border-black p-1.5 text-right">Brüt Tutar (₺)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5 font-mono">{mif.butceTertibi}</td>
                      <td className="border border-black p-1.5">{mif.aciklama}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">
                        {formatCurrency(mif.brutTutar)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Yasal Kesintiler */}
              <div className="my-4">
                <h3 className="font-sans font-bold text-xs uppercase mb-2">2. Yasal Kesintiler Cetveli</h3>
                <table className="w-full border-collapse border border-black font-sans text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-center font-bold">
                      <th className="border border-black p-1.5">Kesinti Türü</th>
                      <th className="border border-black p-1.5">Yasal Dayanak / Oran</th>
                      <th className="border border-black p-1.5 text-right">Kesinti Tutarı (₺)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5">Damga Vergisi</td>
                      <td className="border border-black p-1.5">488 Sayılı Kanun (Binde 9,48)</td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {formatCurrency(mif.damgaVergisiTutari)}
                      </td>
                    </tr>
                    {mif.kararPuluTutari > 0 && (
                      <tr>
                        <td className="border border-black p-1.5">İhale Karar Pulu</td>
                        <td className="border border-black p-1.5">488 Sayılı Kanun (Binde 5,69)</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {formatCurrency(mif.kararPuluTutari)}
                        </td>
                      </tr>
                    )}
                    {mif.kdvTevkifatTutari > 0 && (
                      <tr>
                        <td className="border border-black p-1.5">KDV Tevkifatı</td>
                        <td className="border border-black p-1.5">
                          KDVGT Madde 2.1 ({mif.kdvTevkifatOrani || '5/10'})
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {formatCurrency(mif.kdvTevkifatTutari)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={2} className="border border-black p-1.5 text-right">
                        TOPLAM YASAL KESİNTİLER:
                      </td>
                      <td className="border border-black p-1.5 text-right font-mono">
                        {formatCurrency(totalKesinti)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Ödenecek Tutar Kutusu */}
              <div className="my-4 p-3 border-2 border-black font-sans bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-600">
                    HAK SAHİBİNE NET ÖDENECEK TUTAR:
                  </div>
                  <div className="text-[11px] font-bold italic mt-0.5">
                    YALNIZ #{amountToWordsTL(mif.netOdenecekTutar)}#
                  </div>
                </div>
                <div className="text-lg font-mono font-extrabold">
                  {formatCurrency(mif.netOdenecekTutar)}
                </div>
              </div>
            </div>

            {/* Yetkili İmzaları (5018 Sayılı Kanun) */}
            <div className="pt-6 border-t border-black font-sans">
              <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
                <div className="space-y-10">
                  <div>
                    <strong className="block">DÜZENLEYEN</strong>
                    <span className="text-[9px] text-slate-500">Mali Hizmetler / Mutemet</span>
                  </div>
                  <div>
                    <div className="font-bold">{mif.hazirlayan}</div>
                    <div className="text-[9px] text-slate-500">Tarih: {mif.tarih}</div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <strong className="block">GERÇEKLEŞTİRME GÖREVLİSİ</strong>
                    <span className="text-[9px] text-slate-500">5018 Sayılı Kanun m. 33</span>
                  </div>
                  <div>
                    <div className="font-bold">Ömer Faruk Yılmaz</div>
                    <div className="text-[9px] text-slate-500">İmza / E-İmza Onaylı</div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <strong className="block">HARCAMA YETKİLİSİ</strong>
                    <span className="text-[9px] text-slate-500">5018 Sayılı Kanun m. 31</span>
                  </div>
                  <div>
                    <div className="font-bold">{mif.onaylayan || 'Hüseyin Erdem'}</div>
                    <div className="text-[9px] text-slate-500">
                      {mif.durum === 'onaylandi' ? '✓ E-İmza ile Onaylandı' : 'Onay Bekliyor'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-[8px] text-slate-400 mt-6">
                Bu belge 5018 sayılı Kamu Mali Yönetimi ve Kontrol Kanunu hükümlerine uygun olarak
                Kamu 360 / Temin 360 platformu üzerinden üretilmiştir.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
