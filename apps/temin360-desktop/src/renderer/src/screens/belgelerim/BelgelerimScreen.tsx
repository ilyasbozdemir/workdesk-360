/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import {
  Folder,
  FolderPlus,
  Plus,
  Search,
  Star,
  Archive,
  Trash2,
  Tag,
  KeyRound,
  Upload,
  FileText,
  Clock,
  Sparkles,
  Edit,
  FolderTree,
  AlertTriangle,
  X
} from 'lucide-react'
import { kutuphaneService, KutuphaneBelge, KutuphaneGrup } from './services/kutuphaneService'
import { BelgeEditorModal } from './components/BelgeEditorModal'
import { YerTutucuYonetimiModal } from './components/YerTutucuYonetimiModal'
import { PaketIceAktarModal } from './components/PaketIceAktarModal'

export default function BelgelerimScreen(): React.JSX.Element {
  const [gruplar, setGruplar] = useState<KutuphaneGrup[]>([])
  const [belgeler, setBelgeler] = useState<KutuphaneBelge[]>([])
  const [loading, setLoading] = useState(true)

  // Filtreler
  const [selectedGrupId, setSelectedGrupId] = useState<number | null | 'all' | 'root'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'favori' | 'arsiv' | 'cop'>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modallar
  const [activeBelgeId, setActiveBelgeId] = useState<number | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isPlaceholderModalOpen, setIsPlaceholderModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Grup Ekle / Düzenle Prompt
  const [showGrupModal, setShowGrupModal] = useState(false)
  const [grupForm, setGrupForm] = useState<{ id?: number; ad: string; renk: string }>({
    ad: '',
    renk: 'blue'
  })

  // Yeni Belge Oluşturma Modal Durumu
  const [showNewBelgeModal, setShowNewBelgeModal] = useState(false)
  const [newBelgeAd, setNewBelgeAd] = useState('Yeni Belge')
  const [newBelgeGrupId, setNewBelgeGrupId] = useState<number | null>(null)
  const [isSubmittingBelge, setIsSubmittingBelge] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const gList = await kutuphaneService.listGruplar()
      setGruplar(gList)

      const filters: any = {}
      if (activeFilter === 'cop') {
        filters.cop_kutusu = true
      } else {
        if (activeFilter === 'favori') filters.favori_mi = true
        if (activeFilter === 'arsiv') filters.arsiv_mi = true
        if (selectedGrupId === 'root') filters.grup_id = null
        else if (typeof selectedGrupId === 'number') filters.grup_id = selectedGrupId
      }

      if (searchQuery.trim()) {
        filters.q = searchQuery.trim()
      }

      const bList = await kutuphaneService.listBelgeler(filters)
      setBelgeler(bList)
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedGrupId, activeFilter, searchQuery])

  // Yeni Belge Oluştur (Modalı Aç)
  const handleCreateBelge = (): void => {
    setNewBelgeAd('Yeni Belge')
    setNewBelgeGrupId(typeof selectedGrupId === 'number' ? selectedGrupId : null)
    setShowNewBelgeModal(true)
  }

  // Yeni Belgeyi Kaydet ve Editörü Aç
  const handleConfirmCreateBelge = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault()
    if (!newBelgeAd || !newBelgeAd.trim()) return

    try {
      setIsSubmittingBelge(true)
      const res = await kutuphaneService.createBelge({
        ad: newBelgeAd.trim(),
        grup_id: newBelgeGrupId,
        icerik_html:
          '<h1>' + newBelgeAd.trim() + '</h1><p>Belge içeriğini buraya yazabilirsiniz...</p>'
      })
      setShowNewBelgeModal(false)
      await loadData()
      setActiveBelgeId(res.belgeId)
      setIsEditorOpen(true)
    } catch (err: any) {
      alert('Belge oluşturulamadı: ' + err.message)
    } finally {
      setIsSubmittingBelge(false)
    }
  }

  // Örnek Belge Ekle (Kullanıcı boş alanda başlamak istediğinde hızlı deneme için)
  const handleCreateSampleDoc = async () => {
    try {
      const sampleHtml = `
        <h1>Doğrudan Temin Hizmet Sözleşmesi</h1>
        <p>İşbu sözleşme bir tarafta <span data-ph="idareAdi" data-label="İdare Adı"></span> ile diğer tarafta yüklenici <span data-ph="firmaAdi" data-label="Firma Adı"></span> arasında akdedilmiştir.</p>
        <p>İşin Konusu: <span data-ph="isKonusu" data-label="İşin Konusu"></span></p>
        <p>Toplam Tutar: <span data-ph="toplamTutar" data-label="Toplam Tutar (TL)"></span> TL'dir.</p>
        <div data-cond="kdvDahilMi">
          <p><strong>Özel Not:</strong> Belirtilen fiyata Katma Değer Vergisi (KDV) dahildir.</p>
        </div>
        <p>Tarih: <span data-ph="tarih" data-label="Sözleşme Tarihi"></span></p>
      `
      const res = await kutuphaneService.createBelge({
        ad: 'Örnek Hizmet Sözleşmesi',
        etiketler: ['örnek', 'sözleşme'],
        icerik_html: sampleHtml
      })
      await loadData()
      setActiveBelgeId(res.belgeId)
      setIsEditorOpen(true)
    } catch (err: any) {
      alert('Örnek belge oluşturulamadı: ' + err.message)
    }
  }

  // Grup Kaydet
  const handleSaveGrup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grupForm.ad.trim()) return

    try {
      await kutuphaneService.saveGrup(grupForm)
      setShowGrupModal(false)
      setGrupForm({ ad: '', renk: 'blue' })
      loadData()
    } catch (err: any) {
      alert('Klasör kaydedilemedi: ' + err.message)
    }
  }

  // Grup Sil
  const handleDeleteGrup = async (id: number) => {
    if (
      !confirm(
        'Bu klasörü silmek istediğinize emin misiniz? (İçindeki belgeler klasörsüz kalacaktır)'
      )
    )
      return
    try {
      await kutuphaneService.deleteGrup(id)
      if (selectedGrupId === id) setSelectedGrupId('all')
      loadData()
    } catch (err: any) {
      alert('Klasör silinemedi: ' + err.message)
    }
  }

  // Çöp Kutusu İşlemleri
  const handleTrashBelge = async (id: number) => {
    if (!confirm('Belgeyi çöp kutusuna taşımak istiyor musunuz?')) return
    try {
      await kutuphaneService.trashBelge(id)
      loadData()
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const handleRestoreBelge = async (id: number) => {
    try {
      await kutuphaneService.restoreBelge(id)
      loadData()
    } catch (err: any) {
      alert('Geri yüklenemedi: ' + err.message)
    }
  }

  const handlePermanentDelete = async (id: number) => {
    if (!confirm('Bu belge kalıcı olarak silinecek ve geri alınamayacaktır! Onaylıyor musunuz?'))
      return
    try {
      await kutuphaneService.permanentDeleteBelge(id)
      loadData()
    } catch (err: any) {
      alert('Silinemedi: ' + err.message)
    }
  }

  const handlePurgeExpired = async () => {
    if (
      !confirm(
        '30 günü doldurmuş tüm çöp kutusu kayıtları kalıcı olarak temizlenecektir. Devam edilsin mi?'
      )
    )
      return
    try {
      const count = await kutuphaneService.purgeExpired()
      alert(`${count} adet süresi dolan belge temizlendi.`)
      loadData()
    } catch (err: any) {
      alert('Temizleme hatası: ' + err.message)
    }
  }

  // Favori / Arşiv Toggle
  const handleToggleFavori = async (b: KutuphaneBelge) => {
    try {
      await kutuphaneService.updateMeta({ id: b.id, favori_mi: !b.favori_mi })
      loadData()
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  const handleToggleArsiv = async (b: KutuphaneBelge) => {
    try {
      await kutuphaneService.updateMeta({ id: b.id, arsiv_mi: !b.arsiv_mi })
      loadData()
    } catch (err: any) {
      alert('Hata: ' + err.message)
    }
  }

  // Etiket filtresi
  const filteredBelgeler = selectedTag
    ? belgeler.filter((b) => {
        try {
          const tags: string[] =
            typeof b.etiketler === 'string' ? JSON.parse(b.etiketler) : b.etiketler
          return tags.includes(selectedTag)
        } catch {
          return false
        }
      })
    : belgeler

  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {/* SOL PANEL: Grup Ağacı & Filtreler */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        {/* Başlık */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Belgelerim
              </h1>
              <p className="text-[10px] text-slate-400">Şablon & Belge Alanı</p>
            </div>
          </div>
          <button
            onClick={() => {
              setGrupForm({ ad: '', renk: 'blue' })
              setShowGrupModal(true)
            }}
            title="Yeni Klasör Oluştur"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Görünümler (Tümü, Favoriler, Arşiv, Çöp) */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 space-y-1">
          <button
            onClick={() => {
              setActiveFilter('all')
              setSelectedGrupId('all')
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all' && selectedGrupId === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Tüm Belgeler
            </span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('favori')
              setSelectedGrupId('all')
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'favori'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Favoriler
            </span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('arsiv')
              setSelectedGrupId('all')
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'arsiv'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Archive className="w-4 h-4" /> Arşivdekiler
            </span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('cop')
              setSelectedGrupId('all')
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'cop'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" /> Çöp Kutusu (30 Gün)
            </span>
          </button>
        </div>

        {/* Klasörler Ağacı */}
        {activeFilter !== 'cop' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Klasörler
            </div>

            <button
              onClick={() => setSelectedGrupId('root')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium ${
                selectedGrupId === 'root'
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-slate-400" /> Klasörsüz Belgeler
              </span>
            </button>

            {gruplar.map((g) => (
              <div
                key={g.id}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  selectedGrupId === g.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                onClick={() => setSelectedGrupId(g.id)}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{g.ad}</span>
                </span>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setGrupForm({ id: g.id, ad: g.ad, renk: g.renk })
                      setShowGrupModal(true)
                    }}
                    className="p-1 hover:text-blue-600"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGrup(g.id)
                    }}
                    className="p-1 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Etiketler Filtresi */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                <span>Etiketler</span>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-blue-500 hover:underline normal-case"
                  >
                    Temizle
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 px-2 py-1">
                {Array.from(
                  new Set(
                    belgeler.flatMap((b) => {
                      try {
                        return typeof b.etiketler === 'string'
                          ? JSON.parse(b.etiketler)
                          : b.etiketler
                      } catch {
                        return []
                      }
                    })
                  )
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      selectedTag === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ORTA & SAĞ: Belge Listesi & Araç Çubuğu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Üst Araç Çubuğu */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Belge adı veya içerik ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFilter === 'cop' ? (
              <button
                onClick={handlePurgeExpired}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-800/60"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> 30 Günü Dolanları Temizle
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsPlaceholderModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-500" /> Yer Tutucu Havuzu
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" /> JSON İçe Aktar
                </button>
                <button
                  onClick={handleCreateBelge}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" /> Yeni Belge
                </button>
              </>
            )}
          </div>
        </div>

        {/* Belge Kartları Alanı */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-xs">Belgeler yükleniyor...</div>
          ) : filteredBelgeler.length === 0 ? (
            <div className="text-center py-20 max-w-sm mx-auto">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Henüz Belge Eklenmedi
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Belgelerim alanı serbestçe adlandırıp düzenleyebileceğiniz özel şablon ve metin
                alanıdır.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCreateBelge}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Boş Belge Oluştur
                </button>
                <button
                  onClick={handleCreateSampleDoc}
                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Örnek Belge Yükle
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBelgeler.map((b) => {
                let tags: string[] = []
                try {
                  tags = typeof b.etiketler === 'string' ? JSON.parse(b.etiketler) : b.etiketler
                } catch {
                  tags = []
                }

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (activeFilter !== 'cop') {
                        setActiveBelgeId(b.id)
                        setIsEditorOpen(true)
                      }
                    }}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                          {b.aktif_surum_etiket || `v${b.aktif_surum_no || 1}.0`}
                        </span>

                        {activeFilter !== 'cop' && (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleToggleFavori(b)}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                b.favori_mi ? 'text-amber-500' : 'text-slate-300'
                              }`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => handleToggleArsiv(b)}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                b.arsiv_mi ? 'text-blue-500' : 'text-slate-300'
                              }`}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTrashBelge(b.id)}
                              className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors mb-2">
                        {b.ad}
                      </h3>

                      {/* Etiketler */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.son_guncelleme_at
                          ? new Date(b.son_guncelleme_at).toLocaleDateString('tr-TR')
                          : 'Yeni'}
                      </span>

                      {activeFilter === 'cop' ? (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleRestoreBelge(b.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            Geri Yükle
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(b.id)}
                            className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                          >
                            Kalıcı Sil
                          </button>
                        </div>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                          Düzenle ➔
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODALLAR */}

      {/* Belge Düzenleyici & Form Modalı */}
      {isEditorOpen && activeBelgeId && (
        <BelgeEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false)
            setActiveBelgeId(null)
          }}
          belgeId={activeBelgeId}
          gruplar={gruplar}
          onSaved={loadData}
        />
      )}

      {/* Yer Tutucu Yönetimi Modalı */}
      <YerTutucuYonetimiModal
        isOpen={isPlaceholderModalOpen}
        onClose={() => setIsPlaceholderModalOpen(false)}
      />

      {/* JSON Paket İçe Aktarma Modalı */}
      <PaketIceAktarModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Yeni Belge Oluşturma Modalı */}
      {showNewBelgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleConfirmCreateBelge}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Yeni Belge Oluştur
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    EBYS ve Kamu İhale uyumlu serbest metin veya şablon belgesi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBelgeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Belge Adı / Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBelgeAd}
                  onChange={(e) => setNewBelgeAd(e.target.value)}
                  placeholder="örn: İhtiyaç ve Piyasa Fiyat Araştırma Tutanağı"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Klasör / Kategori
                </label>
                <select
                  value={newBelgeGrupId === null ? '' : newBelgeGrupId}
                  onChange={(e) =>
                    setNewBelgeGrupId(e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="">📁 Klasörsüz (Kök Dizin)</option>
                  {gruplar.map((g) => (
                    <option key={g.id} value={g.id}>
                      📂 {g.ad}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setShowNewBelgeModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmittingBelge || !newBelgeAd.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmittingBelge ? 'Oluşturuluyor...' : 'Oluştur ve Düzenle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grup Oluştur / Düzenle Modalı */}
      {showGrupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveGrup}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
              {grupForm.id ? 'Klasörü Düzenle' : 'Yeni Klasör Ekle'}
            </h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Klasör Adı
                </label>
                <input
                  type="text"
                  required
                  value={grupForm.ad}
                  onChange={(e) => setGrupForm({ ...grupForm, ad: e.target.value })}
                  placeholder="örn: İhale Sözleşmeleri"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowGrupModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs"
              >
                Vazgeç
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
