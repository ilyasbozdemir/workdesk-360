/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Search,
  AlertTriangle,
  FileText,
  KeyRound,
  CheckCircle2
} from 'lucide-react'
import { kutuphaneService, KutuphaneYerTutucuRow } from '../services/kutuphaneService'

interface YerTutucuYonetimiModalProps {
  isOpen: boolean
  onClose: () => void
  onRefreshPlaceholders?: () => void
}

export function YerTutucuYonetimiModal({
  isOpen,
  onClose,
  onRefreshPlaceholders
}: YerTutucuYonetimiModalProps): React.JSX.Element | null {
  const [list, setList] = useState<KutuphaneYerTutucuRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'genel' | 'grup' | 'belge'>('genel')

  // Düzenleme / Ekleme Form Durumu
  const [editingItem, setEditingItem] = useState<Partial<KutuphaneYerTutucuRow> | null>(null)

  // Nerede Kullanılıyor Durumu
  const [usageItem, setUsageItem] = useState<{
    anahtar: string
    usages: Array<{ id: number; ad: string; surum_no: number }>
  } | null>(null)

  // Yeniden Adlandırma Durumu
  const [renameItem, setRenameItem] = useState<{
    item: KutuphaneYerTutucuRow
    newKey: string
    usages: Array<{ id: number; ad: string; surum_no: number }>
  } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await kutuphaneService.listYerTutucular()
      setList(data)
    } catch (err) {
      console.error('Yer tutucular yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredList = list.filter((item) => {
    const matchScope = item.kapsam === activeTab
    const matchText =
      !search ||
      item.anahtar.toLowerCase().includes(search.toLowerCase()) ||
      item.etiket.toLowerCase().includes(search.toLowerCase())
    return matchScope && matchText
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem?.anahtar || !editingItem?.etiket) return

    try {
      await kutuphaneService.saveYerTutucu({
        ...editingItem,
        kapsam: activeTab,
        tip: editingItem.tip || 'metin'
      })
      setEditingItem(null)
      loadData()
      onRefreshPlaceholders?.()
    } catch (err: any) {
      alert('Kaydedilemedi: ' + err.message)
    }
  }

  const handleDelete = async (item: KutuphaneYerTutucuRow) => {
    try {
      const usages = await kutuphaneService.findYerTutucuUsages(item.anahtar)
      if (usages.length > 0) {
        const confirmMsg = `Bu yer tutucu (${item.anahtar}) ${usages.length} belgede kullanılıyor!\n\nKullanan Belgeler:\n${usages
          .map((u) => `• ${u.ad} (v${u.surum_no})`)
          .join('\n')}\n\nYine de silmek istiyor musunuz?`
        if (!confirm(confirmMsg)) return
      } else {
        if (!confirm(`"${item.etiket}" yer tutucusunu silmek istediğinize emin misiniz?`)) return
      }

      await kutuphaneService.deleteYerTutucu(item.id)
      loadData()
      onRefreshPlaceholders?.()
    } catch (err: any) {
      alert('Silinemedi: ' + err.message)
    }
  }

  const handleCheckUsages = async (item: KutuphaneYerTutucuRow) => {
    try {
      const usages = await kutuphaneService.findYerTutucuUsages(item.anahtar)
      setUsageItem({ anahtar: item.anahtar, usages })
    } catch (err: any) {
      alert('Kullanım kontrolü hatası: ' + err.message)
    }
  }

  const handleStartRename = async (item: KutuphaneYerTutucuRow) => {
    try {
      const usages = await kutuphaneService.findYerTutucuUsages(item.anahtar)
      setRenameItem({
        item,
        newKey: item.anahtar,
        usages
      })
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const handleExecuteRename = async () => {
    if (!renameItem || !renameItem.newKey.trim()) return
    if (renameItem.newKey.trim() === renameItem.item.anahtar) {
      setRenameItem(null)
      return
    }

    try {
      await kutuphaneService.renameYerTutucuKey({
        yerTutucuId: renameItem.item.id,
        eskiAnahtar: renameItem.item.anahtar,
        yeniAnahtar: renameItem.newKey.trim(),
        belgeIds: renameItem.usages.map((u) => u.id)
      })
      alert(
        `Anahtar başarıyla güncellendi. ${renameItem.usages.length} belge yeni sürüme aktarıldı.`
      )
      setRenameItem(null)
      loadData()
      onRefreshPlaceholders?.()
    } catch (err: any) {
      alert('Yeniden adlandırma hatası: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Yer Tutucu & Değişken Havuzu
              </h2>
              <p className="text-xs text-slate-500">
                Belgelerde dinamik olarak doldurulan alanları tanımlayın ve yönetin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            {(['genel', 'grup', 'belge'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setEditingItem(null)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab === 'genel' ? 'Genel (Ortak)' : tab === 'grup' ? 'Grup Kapsamı' : 'Belge Özel'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ara (etiket veya anahtar)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
            <button
              onClick={() =>
                setEditingItem({
                  anahtar: '',
                  etiket: '',
                  tip: 'metin',
                  varsayilan: '',
                  kapsam: activeTab
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Yeni Yer Tutucu
            </button>
          </div>
        </div>

        {/* Form Modal / Inline Editor */}
        {editingItem && (
          <form
            onSubmit={handleSave}
            className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Anahtar (Belge İçi Kod) *
              </label>
              <input
                type="text"
                required
                disabled={!!editingItem.id}
                placeholder="örn: sozlesmeTarihi"
                value={editingItem.anahtar || ''}
                onChange={(e) => setEditingItem({ ...editingItem, anahtar: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Etiket (Görünen Başlık) *
              </label>
              <input
                type="text"
                required
                placeholder="örn: Sözleşme Tarihi"
                value={editingItem.etiket || ''}
                onChange={(e) => setEditingItem({ ...editingItem, etiket: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Veri Tipi
              </label>
              <select
                value={editingItem.tip || 'metin'}
                onChange={(e) => setEditingItem({ ...editingItem, tip: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="metin">Metin</option>
                <option value="sayi">Sayı</option>
                <option value="para">Para (TL)</option>
                <option value="tarih">Tarih</option>
                <option value="secim">Seçim (Açılır Liste)</option>
                <option value="cok_satirli">Çok Satırlı Metin</option>
                <option value="liste">Liste (Döngü Şeması)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
              >
                İptal
              </button>
            </div>
          </form>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Yükleniyor...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Bu kapsamda kayıtlı yer tutucu bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 mb-1">
                          {item.tip.toUpperCase()}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {item.etiket}
                        </h4>
                      </div>
                      <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {`{{${item.anahtar}}}`}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-900 text-xs">
                    <button
                      onClick={() => handleCheckUsages(item)}
                      className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-[11px]"
                    >
                      <FileText className="w-3.5 h-3.5" /> Kullanım Yeri
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartRename(item)}
                        title="Anahtarı Belgelerde Güvenle Güncelle"
                        className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1 text-slate-600 hover:text-blue-600 dark:text-slate-400 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Kullanım Alanları Modalı */}
      {usageItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              Kullanım Alanları: {usageItem.anahtar}
            </h3>
            {usageItem.usages.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Bu anahtar hiçbir belgede geçmiyor.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 my-3">
                {usageItem.usages.map((u) => (
                  <div
                    key={u.id}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{u.ad}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      v{u.surum_no}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setUsageItem(null)}
              className="w-full mt-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Güvenli Yeniden Adlandırma Modalı */}
      {renameItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Güvenli Anahtar Güncelleme</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Yer tutucunun anahtarını değiştirdiğinizde, bu anahtarı kullanan{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {renameItem.usages.length} belgenin
              </strong>{' '}
              aktif içeriği otomatik güncellenecek ve yeni bir sürüm kaydedilecektir.
            </p>

            <div className="space-y-2 mb-4">
              <label className="block text-[11px] font-semibold text-slate-500">Yeni Anahtar</label>
              <input
                type="text"
                value={renameItem.newKey}
                onChange={(e) => setRenameItem({ ...renameItem, newKey: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteRename}
                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Tüm Belgelerde Güncelle
              </button>
              <button
                onClick={() => setRenameItem(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
