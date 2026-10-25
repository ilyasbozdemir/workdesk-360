/* eslint-disable */
import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  Clock,
  Printer,
  Download,
  FileText,
  SlidersHorizontal,
  Folder,
  Tag as TagIcon,
  Share2,
  CheckCircle2,
  Paperclip
} from 'lucide-react'
import { A4Editor } from '../../../components/editor/A4Editor'
import {
  KutuphaneBelge,
  KutuphaneBelgeSurum,
  KutuphaneGrup,
  kutuphaneService
} from '../services/kutuphaneService'
import { SurumGecmisiModal } from './SurumGecmisiModal'
import { renderBelge } from '../core/renderer'
import { compileToMustache } from '../core/compiler'

interface BelgeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  belgeId: number
  gruplar: KutuphaneGrup[]
  onSaved: () => void
  dosyaId?: number
}

export function BelgeEditorModal({
  isOpen,
  onClose,
  belgeId,
  gruplar,
  onSaved,
  dosyaId
}: BelgeEditorModalProps): React.JSX.Element | null {
  const [belge, setBelge] = useState<KutuphaneBelge | null>(null)
  const [surumler, setSurumler] = useState<KutuphaneBelgeSurum[]>([])
  const [loading, setLoading] = useState(true)

  // Editör Verileri
  const [ad, setAd] = useState('')
  const [grupId, setGrupId] = useState<number | null>(null)
  const [etiketler, setEtiketler] = useState<string[]>([])
  const [yeniEtiket, setYeniEtiket] = useState('')
  const [contentHtml, setContentHtml] = useState('')

  // Sürüm Notu Modalı
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false)
  const [revTag, setRevTag] = useState('')
  const [revNote, setRevNote] = useState('')

  // Sürüm Geçmişi Modalı
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Sekmeler: 'editor' | 'form'
  const [activeTab, setActiveTab] = useState<'editor' | 'form'>('editor')

  // Form Değerleri & Canlı Çıktı
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [liveHtml, setLiveHtml] = useState('')
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>([])
  const [detectedConditions, setDetectedConditions] = useState<string[]>([])

  const loadBelgeData = async () => {
    setLoading(true)
    try {
      const res = await kutuphaneService.getBelge(belgeId)
      setBelge(res.belge)
      setSurumler(res.surumler)
      setAd(res.belge.ad)
      setGrupId(res.belge.grup_id)

      let parsedTags: string[] = []
      try {
        parsedTags =
          typeof res.belge.etiketler === 'string'
            ? JSON.parse(res.belge.etiketler || '[]')
            : res.belge.etiketler
      } catch {
        parsedTags = []
      }
      setEtiketler(parsedTags)

      // Aktif sürüm içeriği
      const activeSurum =
        res.surumler.find((s) => s.id === res.belge.aktif_surum_id) || res.surumler[0]
      setContentHtml(activeSurum?.icerik_html || '<p></p>')
    } catch (err) {
      console.error('Belge yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && belgeId) {
      loadBelgeData()
    }
  }, [isOpen, belgeId])

  // HTML içindeki data-ph ve data-cond alanlarını tara
  useEffect(() => {
    const phMatches = Array.from(contentHtml.matchAll(/data-ph=["']([^"']+)["']/g)).map((m) => m[1])
    const condMatches = Array.from(contentHtml.matchAll(/data-cond=["']([^"']+)["']/g)).map(
      (m) => m[1]
    )
    setDetectedPlaceholders(Array.from(new Set(phMatches)))
    setDetectedConditions(Array.from(new Set(condMatches)))
  }, [contentHtml])

  // Canlı render
  useEffect(() => {
    if (activeTab === 'form') {
      try {
        const rendered = renderBelge(contentHtml, formValues, [])
        setLiveHtml(rendered)
      } catch (err) {
        console.error('Canlı render hatası:', err)
      }
    }
  }, [activeTab, formValues, contentHtml])

  if (!isOpen) return null

  const handleAddTag = () => {
    if (!yeniEtiket.trim()) return
    if (!etiketler.includes(yeniEtiket.trim())) {
      setEtiketler([...etiketler, yeniEtiket.trim()])
    }
    setYeniEtiket('')
  }

  const handleRemoveTag = (tag: string) => {
    setEtiketler(etiketler.filter((t) => t !== tag))
  }

  const handleSaveRevision = async () => {
    try {
      // 1. Meta bilgileri güncelle
      await kutuphaneService.updateMeta({
        id: belgeId,
        ad,
        grup_id: grupId,
        etiketler
      })

      // 2. Yeni sürüm ekle
      await kutuphaneService.saveRevision({
        belge_id: belgeId,
        etiket: revTag.trim() || undefined,
        not: revNote.trim() || 'Düzenleme',
        icerik_html: contentHtml,
        kosullar_json: '[]'
      })

      setShowRevisionPrompt(false)
      setRevTag('')
      setRevNote('')
      alert('Belge ve yeni sürüm başarıyla kaydedildi.')
      loadBelgeData()
      onSaved()
    } catch (err: any) {
      alert('Kaydedilemedi: ' + err.message)
    }
  }

  const handleExportJson = () => {
    if (!belge) return
    const paket = kutuphaneService.exportBelgePaketi(belge, surumler, [])
    const blob = new Blob([JSON.stringify(paket, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ad.replace(/\s+/g, '_')}_paket.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${ad}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: black; margin: 0; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #333; padding: 6px; }
          </style>
        </head>
        <body>
          ${liveHtml || contentHtml}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const [publishing, setPublishing] = useState(false)
  const [publishedSuccess, setPublishedSuccess] = useState(false)
  const [bindingSuccess, setBindingSuccess] = useState(false)

  const handlePublishToSablon = async () => {
    if (!belge) return
    setPublishing(true)
    try {
      const compiledHtml = compileToMustache(contentHtml)
      const activeSurum = surumler.find((s) => s.id === belge.aktif_surum_id) || surumler[0]
      await kutuphaneService.sablonaYayinla({
        belgeId: belge.id,
        surumNo: activeSurum ? activeSurum.surum_no : 1,
        ad: ad || belge.ad,
        compileEdilmisMustacheHtml: compiledHtml,
        kategori: 'Belgelerim'
      })
      setPublishedSuccess(true)
      setTimeout(() => setPublishedSuccess(false), 3000)
    } catch (err: any) {
      alert('Şablonlara yayınlama hatası: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  const handleBindToDosya = async () => {
    if (!belge || !dosyaId) return
    try {
      const activeSurum = surumler.find((s) => s.id === belge.aktif_surum_id) || surumler[0]
      await kutuphaneService.dosyayaBagla({
        dosyaId,
        belgeId: belge.id,
        surumNo: activeSurum ? activeSurum.surum_no : 1,
        baslik: ad || belge.ad,
        dondurulmusHtml: liveHtml || contentHtml,
        doldurulanDegerler: formValues,
        olusturan: 'Kullanıcı'
      })
      setBindingSuccess(true)
      setTimeout(() => setBindingSuccess(false), 3000)
    } catch (err: any) {
      alert('Dosyaya bağlama hatası: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full h-[95vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Üst Başlık & Meta Çubuğu */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              className="text-base font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-slate-800 dark:text-slate-100 px-1 py-0.5"
              placeholder="Belge Adı..."
            />

            {/* Klasör Seçimi */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Folder className="w-3.5 h-3.5" />
              <select
                value={grupId || ''}
                onChange={(e) => setGrupId(e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-xs"
              >
                <option value="">Genel (Klasörsüz)</option>
                {gruplar.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.ad}
                  </option>
                ))}
              </select>
            </div>

            {/* Etiketler */}
            <div className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex flex-wrap gap-1">
                {etiketler.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    #{t}
                    <button onClick={() => handleRemoveTag(t)} className="hover:text-rose-500">
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+etiket"
                  value={yeniEtiket}
                  onChange={(e) => setYeniEtiket(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-16 text-[10px] bg-transparent border-none outline-none text-slate-600 dark:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sekmeler */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg mr-2">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> A4 Editör
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Form & Canlı Önizleme
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gövde */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Yükleniyor...
            </div>
          ) : activeTab === 'editor' ? (
            <div className="flex-1 h-full">
              <A4Editor
                content={contentHtml}
                onChange={setContentHtml}
                enableKutuphaneExtensions={true}
                availablePlaceholders={detectedPlaceholders.map((k) => ({ key: k, label: k }))}
                availableConditions={detectedConditions.map((c) => ({ flag: c }))}
              />
            </div>
          ) : (
            /* Form & Canlı Önizleme Sekmesi */
            <div className="flex-1 flex overflow-hidden">
              {/* Sol: Form Alanları */}
              <div className="w-96 border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Dinamik Değer Formu
                </h3>

                {detectedPlaceholders.length === 0 && detectedConditions.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Bu belgede henüz tanımlı yer tutucu veya koşullu blok bulunamadı. Editörden yer
                    tutucu ekleyebilirsiniz.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Yer Tutucular */}
                    {detectedPlaceholders.map((ph) => (
                      <div key={ph}>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {ph}
                        </label>
                        <input
                          type="text"
                          value={formValues[ph] || ''}
                          onChange={(e) => setFormValues({ ...formValues, [ph]: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          placeholder={`${ph} değeri...`}
                        />
                      </div>
                    ))}

                    {/* Koşullar */}
                    {detectedConditions.map((cond) => (
                      <div
                        key={cond}
                        className="flex items-center justify-between p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                          {cond}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formValues[cond]}
                            onChange={(e) =>
                              setFormValues({ ...formValues, [cond]: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sağ: Gerçek Zamanlı A4 Render */}
              <div className="flex-1 bg-slate-200 dark:bg-slate-800 p-8 overflow-y-auto flex justify-center custom-scrollbar">
                <div className="w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] shadow-xl border border-slate-300">
                  <div
                    className="prose max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: liveHtml || contentHtml }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Eylem Çubuğu */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              <Clock className="w-4 h-4 text-amber-500" /> Sürüm Geçmişi ({surumler.length})
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              <Download className="w-4 h-4 text-blue-500" /> JSON Dışa Aktar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-emerald-500" /> Yazdır / PDF
            </button>

            {/* Faz 5: Şablonlara Aktar (Tek Tık Yazdır) */}
            <button
              onClick={handlePublishToSablon}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold transition-colors"
              title="Bu belgeyi derleyip Çıktı Merkezi & Tek Tık Yazdır şablonlarına aktarır"
            >
              {publishedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Şablonlara Aktarıldı!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-indigo-500" /> Şablonlara Yayınla
                </>
              )}
            </button>

            {/* Faz 5: Dosyaya Bağla & Kesinleştir (Eğer bir dosya içinde açıldıysa) */}
            {dosyaId && (
              <button
                onClick={handleBindToDosya}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition-colors"
                title="Doldurulan form değerleriyle belgeyi bu dosyaya ek belge olarak bağlar ve kesinleştirir"
              >
                {bindingSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dosyaya Bağlandı!
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 text-emerald-600" /> Dosyaya Bağla & Kesinleştir
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
            >
              Kapat
            </button>
            <button
              onClick={() => setShowRevisionPrompt(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" /> Yeni Sürüm Olarak Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Sürüm Notu Modalı */}
      {showRevisionPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
              Yeni Sürüm Kaydet
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Sürüm Etiketi (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="örn: v2.0 veya 2026_Revizyon"
                  value={revTag}
                  onChange={(e) => setRevTag(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Sürüm Notu
                </label>
                <textarea
                  rows={2}
                  placeholder="Yapılan değişiklikler..."
                  value={revNote}
                  onChange={(e) => setRevNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveRevision}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Onayla & Kaydet
              </button>
              <button
                onClick={() => setShowRevisionPrompt(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sürüm Geçmişi Modalı */}
      {showHistoryModal && (
        <SurumGecmisiModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          belgeId={belgeId}
          belgeAdi={ad}
          surumler={surumler}
          aktifSurumId={belge?.aktif_surum_id || null}
          onRestore={() => {
            loadBelgeData()
            onSaved()
          }}
        />
      )}
    </div>
  )
}
