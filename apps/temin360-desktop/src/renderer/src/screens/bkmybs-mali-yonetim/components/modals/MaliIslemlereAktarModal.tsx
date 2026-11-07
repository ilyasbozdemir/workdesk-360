import React, { useState } from 'react'
import { ButceTertip, MifKayit } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { Coins, X, ShieldCheck, ArrowRight, Calculator } from 'lucide-react'

interface MaliIslemlereAktarModalProps {
  isOpen: boolean
  onClose: () => void
  tertipler: ButceTertip[]
  onAktar: (yeniMif: MifKayit) => void
  dosya?: any
}

export const MaliIslemlereAktarModal: React.FC<MaliIslemlereAktarModalProps> = ({
  isOpen,
  onClose,
  tertipler,
  onAktar,
  dosya
}) => {
  if (!isOpen) return null

  const initialBrut = dosya?.sozlesme_bedeli || dosya?.yaklasik_maliyet || 50000
  const [brutTutar, setBrutTutar] = useState<number>(Number(initialBrut))
  const [seciliTertipId, setSeciliTertipId] = useState<string>(tertipler[0]?.id || '')
  const [alacakliUnvan, setAlacakliUnvan] = useState<string>(
    dosya?.kazanan_firma || 'Örnek İstekli Tedarikçi A.Ş.'
  )
  const [alacakliVkn, setAlacakliVkn] = useState<string>(dosya?.kazanan_vkn || '1234567890')
  const [alacakliIban, setAlacakliIban] = useState<string>('TR120006200000000123456789')
  const [faturaNo, setFaturaNo] = useState<string>('FAT2026-001')
  const [kdvOrani, setKdvOrani] = useState<number>(20)
  const [kdvTevkifat, setKdvTevkifat] = useState<string>('Yok')
  const [kararPuluKesintisi, setKararPuluKesintisi] = useState<boolean>(true)

  // Otomatik Yasal Kesinti Hesaplamaları
  const kdvTutari = (brutTutar * kdvOrani) / 100
  const damgaVergisiTutari = Number((brutTutar * 0.00948).toFixed(2)) // 488 SK Binde 9,48
  const kararPuluTutari = kararPuluKesintisi ? Number((brutTutar * 0.00569).toFixed(2)) : 0 // Binde 5,69
  const kdvTevkifatTutari =
    kdvTevkifat === '5/10' ? Number((kdvTutari * 0.5).toFixed(2)) : 0
  const totalKesinti = damgaVergisiTutari + kararPuluTutari + kdvTevkifatTutari
  const netOdenecekTutar = Number((brutTutar + kdvTutari - totalKesinti).toFixed(2))

  const seciliTertip = tertipler.find((t) => t.id === seciliTertipId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const yeniMif: MifKayit = {
      id: `mif-${Date.now()}`,
      mifNo: `2026/MIF-${Math.floor(1000 + Math.random() * 9000)}`,
      dosyaId: dosya?.id,
      dosyaNo: dosya?.temin_no || '2026/DT-ÖZEL',
      alacakliUnvan,
      alacakliVkn,
      alacakliIban,
      faturaNo,
      faturaTarihi: new Date().toISOString().split('T')[0],
      butceTertibi: seciliTertip
        ? `${seciliTertip.kurumsalKod} - ${seciliTertip.fonksiyonelKod} - ${seciliTertip.ekonomikKod}`
        : '46.06.01.05 - 01.3.1.00 - 03.2.1.01',
      brutTutar,
      kdvOrani,
      kdvTutari,
      kdvTevkifatOrani: kdvTevkifat,
      kdvTevkifatTutari,
      damgaVergisiOrani: 0.00948,
      damgaVergisiTutari,
      kararPuluTutari,
      digerKesintiler: 0,
      netOdenecekTutar,
      durum: 'bloke_edildi',
      hazirlayan: 'Sistem Yöneticisi (Mali Mutemet)',
      tarih: new Date().toISOString().split('T')[0],
      aciklama: `${dosya?.konu || 'Doğrudan Temin'} alımı kesin tahakkuk ve ödeme emri taslağı.`
    }

    onAktar(yeniMif)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Mali İşlemlere Aktar & Ödeme Emri (ÖEB) Taslağı Üret
              </h2>
              <p className="text-[11px] text-slate-500">
                5018 Sayılı Kanun Kapsamında Bütçe Bloke ve MİF Kaydı Oluşturma
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Alacaklı Bilgileri */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Alacaklı (Firma / Şahıs) Unvanı
              </label>
              <input
                type="text"
                required
                value={alacakliUnvan}
                onChange={(e) => setAlacakliUnvan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Vergi Kimlik No (VKN / TCKN)
              </label>
              <input
                type="text"
                required
                value={alacakliVkn}
                onChange={(e) => setAlacakliVkn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Fatura / Hak Sahibi IBAN
              </label>
              <input
                type="text"
                required
                value={alacakliIban}
                onChange={(e) => setAlacakliIban(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Fatura No
              </label>
              <input
                type="text"
                required
                value={faturaNo}
                onChange={(e) => setFaturaNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            </div>
          </div>

          {/* Bütçe Tertibi Seçimi */}
          <div className="text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Bağlanacak Analitik Bütçe Tertibi
            </label>
            <select
              value={seciliTertipId}
              onChange={(e) => setSeciliTertipId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold cursor-pointer"
            >
              {tertipler.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ekonomikKod} - {t.aciklama} (Kullanılabilir: {formatCurrency(t.kullanilabilirOdenek)})
                </option>
              ))}
            </select>
          </div>

          {/* Parasal Tutarlar ve Kesinti Hesaplama Kartı */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calculator size={14} className="text-blue-500" />
                Mali Yasal Kesinti Matrisi (Otomatik 5018 & 488)
              </span>
              <span className="text-[10px] text-slate-400">Damga Vergisi: ‰ 9,48</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Brüt Tutar (₺)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={brutTutar}
                  onChange={(e) => setBrutTutar(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">KDV Oranı (%)</label>
                <select
                  value={kdvOrani}
                  onChange={(e) => setKdvOrani(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                >
                  <option value={20}>%20 Standart</option>
                  <option value={10}>%10 İndirimli</option>
                  <option value={1}>%1 Temel</option>
                  <option value={0}>%0 Muaf</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">KDV Tevkifatı</label>
                <select
                  value={kdvTevkifat}
                  onChange={(e) => setKdvTevkifat(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                >
                  <option value="Yok">Tevkifat Yok</option>
                  <option value="5/10">5/10 Tevkifat</option>
                  <option value="7/10">7/10 Tevkifat</option>
                  <option value="9/10">9/10 Tevkifat</option>
                </select>
              </div>
            </div>

            {/* Kesinti Dağılımı ve Net */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5 text-slate-500 text-[11px]">
                <div>
                  KDV: {formatCurrency(kdvTutari)} | Damga Vergisi: -{formatCurrency(damgaVergisiTutari)}
                </div>
                {kararPuluKesintisi && <div>Karar Pulu: -{formatCurrency(kararPuluTutari)}</div>}
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Net Ödenecek Tutar:
                </span>
                <span className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(netOdenecekTutar)}
                </span>
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>MİF & ÖEB Taslağını Kaydet</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

