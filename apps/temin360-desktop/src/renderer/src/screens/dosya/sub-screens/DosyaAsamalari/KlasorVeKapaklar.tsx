import React, { useState, useEffect, useCallback } from 'react'
import { FolderTree, Eye, FileText, AlertCircle, X, ExternalLink, Loader2 } from 'lucide-react'
import { SubScreen } from '../../SubScreens.screen'
import { useDosyaAsamasiSablons } from './useDosyaAsamasiSablons'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import {
  KlasorStatusHeader,
  KlasorChecklistCard,
  KlasorArsivKonumCard,
  KlasorKapakCiktiCard,
  ChecklistItem
} from './components/KlasorVeKapaklar'

const DEFAULT_GLOBAL_LOCATIONS = [
  'Genel Arşiv',
  'Satınalma Arşivi',
  'Muhasebe Arşivi 1. Dolap',
  'Muhasebe Arşivi 2. Dolap',
  'Bodrum Kat Genel Arşiv',
  'Müdüriyet Odası'
]

const DEFAULT_GLOBAL_BELGELER = [
  { id: 'g1', label: 'İhtiyaç Belgesi / Talep Yazısı' },
  { id: 'g2', label: 'Harcama Talimatı / Onay Belgesi' },
  { id: 'g3', label: 'Yaklaşık Maliyet Cetveli' },
  { id: 'g4', label: 'Piyasa Fiyat Araştırması Görevlendirme Oluru' },
  { id: 'g5', label: 'Piyasa Fiyat Araştırma Tutanağı' },
  { id: 'g6', label: 'Firma Teklif Mektupları (Kaşeli/İmzalı)' },
  { id: 'g7', label: 'Sözleşme / Sipariş Formu' },
  { id: 'g8', label: 'Muayene ve Kabul Komisyonu Oluru' },
  { id: 'g9', label: 'Muayene Kabul Tutanağı' },
  { id: 'g10', label: 'Taşınır İşlem Fişi (TİF)' },
  { id: 'g11', label: 'Fatura Aslı' },
  { id: 'g12', label: 'Vergi Borcu Yoktur Yazısı' },
  { id: 'g13', label: 'SGK Borcu Yoktur Yazısı' },
  { id: 'g14', label: 'Ödeme Emri Belgesi (ÖEB) ve Ekleri' }
]

export function KlasorVeKapaklar(): React.JSX.Element {
  const activeDosyaId = useWorkspaceStore((s) => s.activeDosyaId)

  const {
    activeStarredDocs,
    sablons,
    ciktiLoading,
    previewModalOpen,
    setPreviewModalOpen,
    previewData,
    handleOpenPreviewForSablon,
    quickPrint,
    quickExport,
    quickOpenExternal,
    isSablonDisabled
  } = useDosyaAsamasiSablons()

  const stageSablons = sablons.filter(
    (s) => s.kategori === '5-klasor-ve-kapaklar' || s.kategori === '5. Klasör & Kapaklar'
  )

  // Real Database States
  const [isDosyaClosed, setIsDosyaClosed] = useState(false)
  const [arsivLokasyon, setArsivLokasyon] = useState('')
  const [klasorNo, setKlasorNo] = useState('')
  const [rafNo, setRafNo] = useState('')
  const [isSavingKonum, setIsSavingKonum] = useState(false)
  const [konumSaveSuccess, setKonumSaveSuccess] = useState(false)

  // Institutional Settings State
  const [globalArsivLokasyonlari, setGlobalArsivLokasyonlari] = useState<string[]>(DEFAULT_GLOBAL_LOCATIONS)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

  // Attachment Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<{
    isOpen: boolean
    title: string
    filePath: string
    loading: boolean
    dataUrl?: string
    error?: string
  }>({
    isOpen: false,
    title: '',
    filePath: '',
    loading: false
  })

  // 1. Kurum Ayarlarından Arşiv Lokasyonlarını Yükle
  const loadArchiveSettings = useCallback(async () => {
    try {
      const settings = (await window.electron.ipcRenderer.invoke('db:get-settings')) as Record<string, any>
      if (settings?.arsiv_lokasyonlari) {
        try {
          const parsed = JSON.parse(settings.arsiv_lokasyonlari)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGlobalArsivLokasyonlari(parsed)
            return
          }
        } catch {
          // virgüllü string olabilir
          const split = settings.arsiv_lokasyonlari.split(',').map((s: string) => s.trim()).filter(Boolean)
          if (split.length > 0) {
            setGlobalArsivLokasyonlari(split)
            return
          }
        }
      }
      setGlobalArsivLokasyonlari(DEFAULT_GLOBAL_LOCATIONS)
    } catch (err) {
      console.warn('[KlasorVeKapaklar] Arşiv ayarları okunamadı, varsayılanlar yüklendi:', err)
      setGlobalArsivLokasyonlari(DEFAULT_GLOBAL_LOCATIONS)
    }
  }, [])

  // Yeni Arşiv Lokasyonu Ekle ve Ayarlara Kaydet
  const handleAddLocationToSettings = async (newLocation: string): Promise<void> => {
    if (!newLocation.trim()) return
    const updated = Array.from(new Set([...globalArsivLokasyonlari, newLocation.trim()]))
    setGlobalArsivLokasyonlari(updated)
    try {
      await window.electron.ipcRenderer.invoke('db:save-settings', {
        arsiv_lokasyonlari: JSON.stringify(updated)
      })
    } catch (err) {
      console.error('[KlasorVeKapaklar] Yeni lokasyon ayarlara kaydedilemedi:', err)
    }
  }

  // 2. Aktif Dosyanın Fiziksel Arşiv Verilerini ve Eklerini Yükle
  const loadDosyaArsivData = useCallback(async () => {
    if (!activeDosyaId) return

    try {
      // 2.1 Dosya ana tablosundan arşiv verilerini çek
      const fileRows = (await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, arsiv_lokasyon, klasor_no, raf_no, dosya_kapali_mi, durum, klasor_checklist FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1',
        [activeDosyaId]
      )) as any[]

      const fileData = fileRows?.[0]
      if (fileData) {
        setArsivLokasyon(fileData.arsiv_lokasyon || '')
        setKlasorNo(fileData.klasor_no || '')
        setRafNo(fileData.raf_no || '')
        setIsDosyaClosed(
          fileData.dosya_kapali_mi === 1 ||
          fileData.durum === 'KAPANDI' ||
          fileData.durum === 'ARŞİVLENDİ'
        )
      }

      // 2.2 Ekli fatura, irsaliye ve imzalı PDF'leri çek (DATA_TeminBelge)
      const attachmentRows = (await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT id, belge_adi, sablon_kodu, dosya_yolu, veri_json, durum, created_at 
         FROM DATA_TeminBelge 
         WHERE temin_dosya_id = ? AND dosya_yolu IS NOT NULL AND dosya_yolu != ''
         ORDER BY id ASC`,
        [activeDosyaId]
      )) as any[]

      const attachmentChecklistItems: ChecklistItem[] = (attachmentRows || []).map((row) => {
        let meta: any = {}
        try {
          if (row.veri_json) meta = JSON.parse(row.veri_json)
        } catch {
          meta = {}
        }
        const fileType = meta.fileType || row.sablon_kodu || 'ek'
        const typeLabel = fileType === 'irsaliye' ? 'Teslimat İrsaliyesi' : fileType === 'fatura' ? 'Fatura Aslı' : 'Ek Belge'

        return {
          id: `att_${row.id}`,
          label: `${typeLabel}: ${row.belge_adi}`,
          checked: true,
          isAttachment: true,
          fileType,
          filePath: row.dosya_yolu,
          amount: meta.amount,
          date: row.created_at
        }
      })

      // 2.3 Kaydedilmiş kullanıcı checklist'i var mı?
      let initialList: ChecklistItem[] = []
      if (fileData?.klasor_checklist) {
        try {
          const parsedChecklist = JSON.parse(fileData.klasor_checklist)
          if (Array.isArray(parsedChecklist) && parsedChecklist.length > 0) {
            initialList = parsedChecklist
          }
        } catch {}
      }

      // Eğer kayıtlı checklist yoksa varsayılan resmî belgelerle başlat
      if (initialList.length === 0) {
        initialList = [
          { id: '1', label: 'Harcama Talimatı / Onay Belgesi', checked: true },
          { id: '2', label: 'Yaklaşık Maliyet Cetveli', checked: true },
          { id: '3', label: 'Piyasa Fiyat Araştırma Tutanağı', checked: true },
          { id: '4', label: 'Firma Teklif Mektupları (Kaşeli/İmzalı)', checked: false },
          { id: '5', label: 'Sözleşme / Sipariş Formu', checked: false },
          { id: '6', label: 'Muayene ve Kabul Komisyon Tutanağı', checked: false }
        ]
      }

      // 2.4 Yüklenen fatura ve ekleri checklist ile harmanla (yinelenenleri engelle)
      const existingLabels = new Set(initialList.map((item) => item.label))
      for (const attItem of attachmentChecklistItems) {
        if (!existingLabels.has(attItem.label)) {
          initialList.push(attItem)
          existingLabels.add(attItem.label)
        }
      }

      setChecklist(initialList)
    } catch (err) {
      console.error('[KlasorVeKapaklar] Veriler yüklenirken hata:', err)
    }
  }, [activeDosyaId])

  useEffect(() => {
    loadArchiveSettings()
    loadDosyaArsivData()
  }, [loadArchiveSettings, loadDosyaArsivData])

  // Checklist Değişikliğini Veritabanına Kaydet
  const saveChecklistToDb = async (updatedList: ChecklistItem[]): Promise<void> => {
    if (!activeDosyaId) return
    try {
      await window.electron.ipcRenderer.invoke(
        'db:query',
        'UPDATE DATA_TeminDosyasi SET klasor_checklist = ? WHERE id = ?',
        [JSON.stringify(updatedList), activeDosyaId]
      )
    } catch (err) {
      console.error('[KlasorVeKapaklar] Checklist kaydedilemedi:', err)
    }
  }

  const handleToggleChecklist = (id: string): void => {
    const updated = checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    setChecklist(updated)
    saveChecklistToDb(updated)
  }

  const handleRemoveItem = (id: string): void => {
    const updated = checklist.filter((c) => c.id !== id)
    setChecklist(updated)
    saveChecklistToDb(updated)
  }

  const handleAddFromGlobal = (globalItem: { id: string; label: string }): void => {
    if (!checklist.some((c) => c.label === globalItem.label)) {
      const updated = [
        ...checklist,
        {
          id: crypto.randomUUID(),
          label: globalItem.label,
          checked: false
        }
      ]
      setChecklist(updated)
      saveChecklistToDb(updated)
    }
  }

  const handleAddCustomItem = (text: string): void => {
    if (!text.trim()) return
    const updated = [
      ...checklist,
      {
        id: crypto.randomUUID(),
        label: text.trim(),
        checked: false
      }
    ]
    setChecklist(updated)
    saveChecklistToDb(updated)
  }

  const handleMoveUp = (index: number): void => {
    if (index === 0) return
    const newList = [...checklist]
    const temp = newList[index - 1]
    newList[index - 1] = newList[index]
    newList[index] = temp
    setChecklist(newList)
    saveChecklistToDb(newList)
  }

  const handleMoveDown = (index: number): void => {
    if (index === checklist.length - 1) return
    const newList = [...checklist]
    const temp = newList[index + 1]
    newList[index + 1] = newList[index]
    newList[index] = temp
    setChecklist(newList)
    saveChecklistToDb(newList)
  }

  // Fiziksel Arşiv Konumunu Kaydet
  const handleSaveKonum = async (): Promise<void> => {
    if (!activeDosyaId) return
    try {
      setIsSavingKonum(true)
      await window.electron.ipcRenderer.invoke(
        'db:query',
        `UPDATE DATA_TeminDosyasi 
         SET arsiv_lokasyon = ?, klasor_no = ?, raf_no = ? 
         WHERE id = ?`,
        [arsivLokasyon, klasorNo, rafNo, activeDosyaId]
      )
      setKonumSaveSuccess(true)
      setTimeout(() => setKonumSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error('[KlasorVeKapaklar] Konum kaydedilemedi:', err)
      alert(`Konum kaydedilirken hata oluştu: ${err.message || String(err)}`)
    } finally {
      setIsSavingKonum(false)
    }
  }

  // Dosya Kapatma / Kilitleme Durumunu Değiştir
  const handleToggleDosyaClosed = async (): Promise<void> => {
    if (!activeDosyaId) return
    const nextState = !isDosyaClosed
    try {
      await window.electron.ipcRenderer.invoke(
        'db:query',
        `UPDATE DATA_TeminDosyasi 
         SET dosya_kapali_mi = ?, durum = ? 
         WHERE id = ?`,
        [nextState ? 1 : 0, nextState ? 'KAPANDI' : 'devam_ediyor', activeDosyaId]
      )
      setIsDosyaClosed(nextState)
    } catch (err: any) {
      console.error('[KlasorVeKapaklar] Dosya kapanış durumu güncellenemedi:', err)
      alert(`Dosya durumu güncellenemedi: ${err.message || String(err)}`)
    }
  }

  // Ekli Fatura / İrsaliye Belgesini ZIP Arşivinden Çözüp Önizleme
  const handlePreviewAttachment = async (filePath: string, title: string): Promise<void> => {
    setPreviewAttachment({
      isOpen: true,
      title,
      filePath,
      loading: true,
      error: undefined
    })

    try {
      const res = await window.electron.ipcRenderer.invoke(
        'workspace:read-attachment-base64',
        filePath
      )

      if (res.success && res.data?.base64) {
        const mime = res.data.mimeType || 'application/pdf'
        const dataUrl = `data:${mime};base64,${res.data.base64}`
        setPreviewAttachment({
          isOpen: true,
          title,
          filePath,
          loading: false,
          dataUrl
        })
      } else {
        throw new Error(res.error || 'Dosya arşivden okunamadı.')
      }
    } catch (err: any) {
      setPreviewAttachment({
        isOpen: true,
        title,
        filePath,
        loading: false,
        error: `Belge önizlenemedi: ${err.message || String(err)}`
      })
    }
  }

  const handleOpenExternal = async (filePath: string): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke('workspace:open-file', filePath)
    } catch (err: any) {
      alert(`Dosya açılamadı: ${err.message || String(err)}`)
    }
  }

  // Şablon Önizleme açılırken fiziksel konum bilgilerini override et
  const handleCustomSablonPreview = (sablon: any, title: string): Promise<void> => {
    return handleOpenPreviewForSablon(sablon, title, {
      klasorNo: klasorNo || '1',
      arsivLokasyon: arsivLokasyon || '',
      rafNo: rafNo || ''
    })
  }

  return (
    <SubScreen
      title="Klasör & Kapaklar"
      icon={FolderTree}
      description="İhale kapağı, kapak içi indeks şablonu ve fiziksel arşiv dosyalarınızı hazırlayabilirsiniz. Süreci tamamlayıp dosyayı kapatabilirsiniz."
      previewDocumentId={previewModalOpen && previewData?.dosyaAdi ? previewData.dosyaAdi : null}
      onClosePreview={() => setPreviewModalOpen(false)}
    >
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {/* TOP STATUS BAR */}
        <KlasorStatusHeader
          isDosyaClosed={isDosyaClosed}
          onToggleDosyaClosed={handleToggleDosyaClosed}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Checklist with real documents & invoices */}
          <div className="flex flex-col gap-6">
            <KlasorChecklistCard
              checklist={checklist}
              isDosyaClosed={isDosyaClosed}
              onToggleChecklist={handleToggleChecklist}
              onRemoveItem={handleRemoveItem}
              onAddFromGlobal={handleAddFromGlobal}
              onAddCustomItem={handleAddCustomItem}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              globalBelgeler={DEFAULT_GLOBAL_BELGELER}
              onPreviewAttachment={handlePreviewAttachment}
            />
          </div>

          {/* RIGHT COLUMN: Physical Location & Covers */}
          <div className="flex flex-col gap-6">
            <KlasorArsivKonumCard
              isDosyaClosed={isDosyaClosed}
              arsivLokasyon={arsivLokasyon}
              klasorNo={klasorNo}
              rafNo={rafNo}
              globalArsivLokasyonlari={globalArsivLokasyonlari}
              onArsivLokasyonChange={setArsivLokasyon}
              onKlasorNoChange={setKlasorNo}
              onRafNoChange={setRafNo}
              onSaveKonum={handleSaveKonum}
              onAddLocation={handleAddLocationToSettings}
              isSaving={isSavingKonum}
              saveSuccess={konumSaveSuccess}
            />

            <KlasorKapakCiktiCard
              stageSablons={stageSablons}
              sablons={sablons}
              activeStarredDocs={activeStarredDocs}
              ciktiLoading={ciktiLoading}
              handleOpenPreviewForSablon={handleCustomSablonPreview}
              quickPrint={quickPrint}
              quickExport={quickExport}
              quickOpenExternal={quickOpenExternal}
              isSablonDisabled={isSablonDisabled}
            />
          </div>
        </div>

        {/* ATTACHMENT / PDF PREVIEW MODAL */}
        {previewAttachment.isOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {previewAttachment.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Fiziksel Dosya Eki • .temin ZIP Arşivinden Çözüldü
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenExternal(previewAttachment.filePath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Harici Uygulamada Aç
                  </button>
                  <button
                    onClick={() => setPreviewAttachment({ isOpen: false, title: '', filePath: '', loading: false })}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/50 min-h-[450px]">
                {previewAttachment.loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Belge .temin ZIP arşivinden okunuyor...
                    </span>
                  </div>
                ) : previewAttachment.error ? (
                  <div className="flex flex-col items-center gap-2 text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">{previewAttachment.error}</p>
                    <button
                      onClick={() => handleOpenExternal(previewAttachment.filePath)}
                      className="mt-2 text-xs font-bold text-blue-600 underline cursor-pointer"
                    >
                      Harici görüntüleyici ile açmayı dene
                    </button>
                  </div>
                ) : previewAttachment.dataUrl ? (
                  previewAttachment.title.toLowerCase().endsWith('.png') ||
                  previewAttachment.title.toLowerCase().endsWith('.jpg') ||
                  previewAttachment.title.toLowerCase().endsWith('.jpeg') ? (
                    <img
                      src={previewAttachment.dataUrl}
                      alt={previewAttachment.title}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <iframe
                      src={previewAttachment.dataUrl}
                      title={previewAttachment.title}
                      className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white"
                    />
                  )
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </SubScreen>
  )
}
