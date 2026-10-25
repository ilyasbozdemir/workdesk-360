import React from 'react'
import {
  Layers,
  FileText,
  Settings,
  Info,
  Building2,
  Calendar,
  ArrowUpRight,
  Plus,
  Check
} from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Proje } from '../../../hooks/useProjeHooks'
import { COLOR_PRESETS, DURUM_CONFIG } from '../constants'
import { APP_ROUTES } from '../../../constants/routeConstants'

interface ProjeDetailModalProps {
  detailProje: Proje | null
  setDetailProje: (p: Proje | null) => void
  detailTab: 'ozet' | 'dosyalar' | 'duzenle'
  setDetailTab: (tab: 'ozet' | 'dosyalar' | 'duzenle') => void
  projeDosyalari: any[]
  isLoadingDosyalar: boolean
  handleNavigateToDosya: (dosyaId: number) => void
  formCode: string
  setFormCode: (v: string) => void
  formName: string
  setFormName: (v: string) => void
  formDesc: string
  setFormDesc: (v: string) => void
  formBudget: string
  setFormBudget: (v: string) => void
  formStartDate: string
  setFormStartDate: (v: string) => void
  formEndDate: string
  setFormEndDate: (v: string) => void
  formLocation: string
  setFormLocation: (v: string) => void
  formDurum: 'planlama' | 'devam' | 'tamamlandi'
  setFormDurum: (v: 'planlama' | 'devam' | 'tamamlandi') => void
  formColor: string
  setFormColor: (v: string) => void
  handleSubmit: (e: React.FormEvent) => void
  navigate: (opts: { to: string }) => void
}

export function ProjeDetailModal({
  detailProje,
  setDetailProje,
  detailTab,
  setDetailTab,
  projeDosyalari,
  isLoadingDosyalar,
  handleNavigateToDosya,
  formCode,
  setFormCode,
  formName,
  setFormName,
  formDesc,
  setFormDesc,
  formBudget,
  setFormBudget,
  formStartDate,
  setFormStartDate,
  formEndDate,
  setFormEndDate,
  formLocation,
  setFormLocation,
  formDurum,
  setFormDurum,
  formColor,
  setFormColor,
  handleSubmit,
  navigate
}: ProjeDetailModalProps): React.JSX.Element | null {
  if (!detailProje) return null

  return (
    <Modal
      isOpen={Boolean(detailProje)}
      onClose={() => setDetailProje(null)}
      title={`Proje Detay Yönetimi: ${detailProje.proje_adi}`}
      className="max-w-5xl w-11/12 max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Header Banner & Navigation Tabs */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-12 rounded-full shrink-0"
                style={{ backgroundColor: detailProje.renk || '#3b82f6' }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {detailProje.proje_kodu}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {detailProje.proje_adi}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {detailProje.lokasyon || 'Tüm Birimler / Genel Proje'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${DURUM_CONFIG[detailProje.durum]?.color}`}
              >
                {DURUM_CONFIG[detailProje.durum]?.label}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pt-2">
            <button
              onClick={() => setDetailTab('ozet')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                detailTab === 'ozet'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers size={14} /> Genel Bakış & Finansal Özet
            </button>
            <button
              onClick={() => setDetailTab('dosyalar')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                detailTab === 'dosyalar'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={14} /> Bağlı Temin & İhale Dosyaları ({projeDosyalari.length})
            </button>
            <button
              onClick={() => setDetailTab('duzenle')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                detailTab === 'duzenle'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Settings size={14} /> Projeyi Düzenle
            </button>
          </div>
        </div>

        {/* TAB 1: Genel Bakış */}
        {detailTab === 'ozet' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">
                  Tahsis Edilen Ödenek Bütçesi
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {detailProje.toplam_butce > 0
                    ? `${Number(detailProje.toplam_butce).toLocaleString('tr-TR')} ₺`
                    : 'Belirtilmedi'}
                </div>
                <p className="text-[11px] text-slate-400">
                  {detailProje.toplam_butce > 0
                    ? 'Tanımlanan üst ödenek limiti'
                    : 'Serbest / Limit tanımlanmamış'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block flex items-center justify-between">
                  Otomatik Gerçekleşen Harcama
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                    Canlı Veri
                  </span>
                </span>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {Number(detailProje.harcanan_tutar).toLocaleString('tr-TR')} ₺
                </div>
                <p className="text-[11px] text-slate-400">
                  {projeDosyalari.length} bağlı temin dosyasının toplam yaklaşık maliyetleri
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">Kalan Bütçe Payı</span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {detailProje.toplam_butce > 0
                    ? `${Number(detailProje.kalan_butce).toLocaleString('tr-TR')} ₺`
                    : 'Esnek'}
                </div>
                <p className="text-[11px] text-slate-400">
                  {detailProje.toplam_butce > 0
                    ? `Kullanım oranı: %${detailProje.harcama_yuzdesi || 0}`
                    : 'Kısıtlama bulunmuyor'}
                </p>
              </div>
            </div>

            {/* Auto Calculation Notice */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <strong className="text-blue-900 dark:text-blue-200 block font-semibold">
                  Otomatik Harcama & Bütçe Yönetimi Mantığı:
                </strong>
                <p>
                  Proje harcamaları manuel sayı girilerek yönetilmez. Bu projeye doğrudan temin veya
                  ihale dosyası bağlandıkça, dosyaların maliyet tutarları proje harcamasına otomatik
                  yansıtılır.
                </p>
              </div>
            </div>

            {/* Proje Detayları & Açıklama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Lokasyon & Tarih Bilgileri
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-400" /> Lokasyon / Birim:
                    </span>
                    <strong className="text-slate-900 dark:text-white">
                      {detailProje.lokasyon || 'Tüm Birimler'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" /> Başlangıç Tarihi:
                    </span>
                    <strong className="text-slate-900 dark:text-white">
                      {detailProje.baslangic_tarihi || 'Belirtilmedi'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" /> Bitiş / Hedef Tarih:
                    </span>
                    <strong className="text-slate-900 dark:text-white">
                      {detailProje.bitis_tarihi || 'Belirtilmedi'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Açıklama & Kapsam
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {detailProje.aciklama || 'Bu proje için henüz detaylı açıklama metni eklenmemiş.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Bağlı İhale / Temin Dosyaları */}
        {detailTab === 'dosyalar' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText size={15} className="text-blue-500" />
                Bu Projeye Bağlı Doğrudan Temin ve İhale Dosyaları ({projeDosyalari.length})
              </h4>

              <Button
                onClick={() => {
                  setDetailProje(null)
                  navigate({ to: APP_ROUTES.YENI_DOSYA })
                }}
                className="text-xs h-8 px-3 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Yeni Dosya Başlat
              </Button>
            </div>

            {isLoadingDosyalar ? (
              <div className="py-12 text-center text-xs text-slate-400">Dosyalar yükleniyor...</div>
            ) : projeDosyalari.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-xs text-slate-500 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto">
                  <FileText size={20} />
                </div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Bu projeye tanımlı herhangi bir doğrudan temin veya ihale dosyası bulunamadı.
                </p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Doğrudan temin dosyası oluştururken veya var olan dosyanın &quot;Genel
                  Bilgiler&quot; sekmesinde proje seçim alanından bu projeyi seçerek
                  bağlayabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Dosya No</th>
                      <th className="py-3 px-4">İş / Konu Adı</th>
                      <th className="py-3 px-4">Alım Türü</th>
                      <th className="py-3 px-4">Süreç Durumu</th>
                      <th className="py-3 px-4 text-right">Yaklaşık Maliyet</th>
                      <th className="py-3 px-4 text-center">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {projeDosyalari.map((dosya) => (
                      <tr
                        key={dosya.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {dosya.dosya_no || `DT-${dosya.id}`}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                          {dosya.is_adi}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {dosya.alim_turu || 'Doğrudan Temin'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {dosya.surec_durumu || 'Devam Ediyor'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                          {Number(dosya.yaklasik_maliyet || 0).toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            onClick={() => {
                              setDetailProje(null)
                              handleNavigateToDosya(dosya.id)
                            }}
                            className="text-xs h-7 px-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1 cursor-pointer"
                          >
                            Dosyayı Aç <ArrowUpRight size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Projeyi Düzenle (Inline Edit Form) */}
        {detailTab === 'duzenle' && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proje Kodu *
                </label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="PRJ-2026-001"
                  required
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahsis Edilen Ödenek Bütçesi (₺) - İsteğe Bağlı
                </label>
                <Input
                  type="number"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  placeholder="Örn: 1500000 (Boş bırakılabilir)"
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proje / Yatırım Adı *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Örn: 2026 Yılı Hizmet Binaları Bakım Onarım Projesi"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lokasyon / İlgili Birim
                </label>
                <Input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Örn: Merkez Kampüs & Ek Binalar"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proje Durumu
                </label>
                <select
                  value={formDurum}
                  onChange={(e) => setFormDurum(e.target.value as any)}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="devam">Devam Ediyor</option>
                  <option value="planlama">Planlama Aşamasında</option>
                  <option value="tamamlandi">Tamamlandı</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Başlangıç Tarihi
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bitiş / Hedef Tarihi
                </label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Açıklama / Kapsam
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Projenin amacı, hedefleri ve kapsamı..."
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Proje Renk Etiketi
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                      formColor === c
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {formColor === c && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="submit"
                className="text-xs bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Güncellemeleri Kaydet
              </Button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={() => setDetailProje(null)} className="text-xs">
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  )
}
