'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchTeminStatsAction,
  fetchTeminTableRowsAction,
  insertTeminRowAction,
  deleteTeminRowAction
} from '@/app/actions'
import {
  TableProperties,
  FolderOpen,
  Building2,
  Users,
  Package,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

type TeminTable = 'DATA_TeminDosyasi' | 'TANIM_Firma' | 'TANIM_Personel' | 'DATA_TeminKalem' | 'settings'

export default function LiveDataPage() {
  const [activeTable, setActiveTable] = useState<TeminTable>('DATA_TeminDosyasi')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Record<string, any>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Yeni kayıt modal/form durumu
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  // İstatistikleri yükle
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchTeminStatsAction()
      if (res.success) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Stats loading error:', err)
    }
  }, [])

  // Tablo satırlarını yükle
  const loadRows = useCallback(async (table: TeminTable, searchTerm?: string) => {
    setLoading(true)
    try {
      const res = await fetchTeminTableRowsAction(table, searchTerm)
      if (res.success && res.data) {
        setRows(res.data.rows)
        setColumns(res.data.columns)
      }
    } catch (err) {
      console.error('Table rows loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadRows(activeTable, search)
  }, [activeTable, loadStats, loadRows, search])

  // Yeni Kayıt Ekle
  const handleInsert = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await insertTeminRowAction(activeTable, formData)
      if (res.success) {
        setMessage({ type: 'success', text: res.data?.message || 'Kayıt başarıyla eklendi!' })
        setFormData({})
        setShowAddForm(false)
        await loadRows(activeTable, search)
        await loadStats()
      } else {
        setMessage({ type: 'error', text: res.error?.message || 'Ekleme başarısız!' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  // Kayıt Sil
  const handleDelete = async (id: string | number) => {
    if (!confirm(`Bu kaydı (${id}) veritabanından kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await deleteTeminRowAction(activeTable, id)
      if (res.success) {
        setMessage({ type: 'success', text: `Kayıt (${id}) veritabanından başarıyla silindi.` })
        await loadRows(activeTable, search)
        await loadStats()
      } else {
        setMessage({ type: 'error', text: res.error?.message || 'Silme işlemi başarısız!' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Silme hatası' })
    } finally {
      setLoading(false)
    }
  }

  const tableTabs: { id: TeminTable; label: string; icon: any; countKey: string }[] = [
    { id: 'DATA_TeminDosyasi', label: 'Satın Alma Dosyaları', icon: FolderOpen, countKey: 'totalDosya' },
    { id: 'TANIM_Firma', label: 'Tedarikçi Firmalar', icon: Building2, countKey: 'totalFirma' },
    { id: 'TANIM_Personel', label: 'Personel Listesi', icon: Users, countKey: 'totalPersonel' },
    { id: 'DATA_TeminKalem', label: 'İhtiyaç Kalemleri', icon: Package, countKey: 'totalKalem' },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings, countKey: 'totalSettings' }
  ]

  return (
    <div className="space-y-6">
      {/* Üst Başlık & İstatistikler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Canlı Temin 360 Veritabanı ve Tablo Yöneticisi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Masaüstü uygulamamızın gerçek SQLite veritabanındaki tabloları anlık görüntüleyin, yeni kayıtlar ekleyin ve silin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadStats()
              loadRows(activeTable, search)
            }}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setFormData({})
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kayıt Ekle</span>
          </button>
        </div>
      </div>

      {/* İstatistik Rozetleri */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Dosya</div>
            <div className="text-xl font-extrabold text-blue-600 mt-1">{stats.totalDosya}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">DATA_TeminDosyasi</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Firmalar</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">{stats.totalFirma}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">TANIM_Firma</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Personel</div>
            <div className="text-xl font-extrabold text-purple-600 mt-1">{stats.totalPersonel}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">TANIM_Personel</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">İhtiyaç Kalemleri</div>
            <div className="text-xl font-extrabold text-amber-600 mt-1">{stats.totalKalem}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">DATA_TeminKalem</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Ayar Kayıtları</div>
            <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">{stats.totalSettings}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">settings tablosu</div>
          </div>
        </div>
      )}

      {/* Mesaj Bildirimi */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[10px] font-bold underline cursor-pointer">
            Kapat
          </button>
        </div>
      )}

      {/* Tablo Seçim Butonları & Arama */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tableTabs.map((t) => {
            const Icon = t.icon
            const isCurrent = activeTable === t.id
            const count = stats ? stats[t.countKey] : 0

            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTable(t.id)
                  setSearch('')
                  setShowAddForm(false)
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isCurrent ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Canlı Arama */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tabloda ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Yeni Kayıt Ekleme Formu */}
      {showAddForm && (
        <form
          onSubmit={handleInsert}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-slate-900 dark:to-blue-950/20 border border-blue-200 dark:border-blue-900 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900/40">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Yeni Kayıt Ekle — {activeTable}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Vazgeç
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTable === 'DATA_TeminDosyasi' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temin No:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2026/88"
                    value={formData.temin_no || ''}
                    onChange={(e) => setFormData({ ...formData, temin_no: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İşin Konusu:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sunucu Bakım ve Lisans Alımı"
                    value={formData.konu || ''}
                    onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Yaklaşık Maliyet (TL):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="75000"
                    value={formData.yaklasik_maliyet || ''}
                    onChange={(e) => setFormData({ ...formData, yaklasik_maliyet: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alım Türü:
                  </label>
                  <select
                    value={formData.tur || 'mal'}
                    onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="mal">Mal Alımı</option>
                    <option value="hizmet">Hizmet Alımı</option>
                    <option value="yapim">Yapım İşleri</option>
                    <option value="danismanlik">Danışmanlık</option>
                  </select>
                </div>
              </>
            )}

            {activeTable === 'TANIM_Firma' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Firma Unvanı:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Global Teknoloji A.Ş."
                    value={formData.unvan || ''}
                    onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vergi Kimlik No:
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    value={formData.vergi_no || ''}
                    onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon:
                  </label>
                  <input
                    type="text"
                    placeholder="0212 555 4321"
                    value={formData.telefon || ''}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {activeTable === 'TANIM_Personel' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Soyad:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.ad_soyad || ''}
                    onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unvan:
                  </label>
                  <input
                    type="text"
                    placeholder="Bilgisayar Mühendisi"
                    value={formData.unvan || ''}
                    onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Görev:
                  </label>
                  <input
                    type="text"
                    placeholder="Piyasa Araştırma Üyesi"
                    value={formData.gorev || ''}
                    onChange={(e) => setFormData({ ...formData, gorev: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {activeTable === 'DATA_TeminKalem' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kalem Adı:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="A4 Fotokopi Kağıdı"
                    value={formData.kalem_adi || ''}
                    onChange={(e) => setFormData({ ...formData, kalem_adi: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Miktar:
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="50"
                    value={formData.miktar || ''}
                    onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Birim:
                  </label>
                  <input
                    type="text"
                    placeholder="Koli / Adet"
                    value={formData.birim || ''}
                    onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {activeTable === 'settings' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Anahtar (Key):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ornek_ayar_key"
                    value={formData.key || ''}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Değer (Value):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ornek_deger"
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Veritabanına Kaydet (INSERT)</span>
            </button>
          </div>
        </form>
      )}

      {/* Canlı Tablo Grid Görünümü */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {activeTable} ({rows.length} kayıt listeleniyor)
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Canlı SQLite / Fixture DB
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {loading ? 'Kayıtlar yükleniyor...' : 'Bu tabloda listelenecek kayıt bulunamadı.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {rows.map((row, idx) => {
                  const rowId = activeTable === 'settings' ? row.key : row.id

                  return (
                    <tr
                      key={rowId || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                            <span className="text-slate-400 italic">null</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(rowId)}
                          disabled={loading}
                          className="px-2 py-1 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Bu kaydı sil"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Sil</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
