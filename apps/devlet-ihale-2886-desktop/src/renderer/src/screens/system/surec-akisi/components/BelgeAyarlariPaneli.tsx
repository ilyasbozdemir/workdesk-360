import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  FileText,
  GitFork,
  Paperclip,
  Plus,
  Send,
  Settings,
  Share2,
  Trash2,
  Users
} from 'lucide-react'
import type {
  DocumentEvrakSettings,
  EvrakEkKalemi,
  EvrakIlgiKalemi,
  GonderimKanali,
  MuhatapHiyerarsi
} from '../documentSettings.types'
import { ekOner, ilgiOner, kapanisIbaresi } from '../documentSettingsUtils'
import { TemplateRegistryService } from '@temin360/document-templates'

interface BelgeAyarlariPaneliProps {
  selectedBelgeId?: string
  belgeAdi?: string
  evrakSettings: DocumentEvrakSettings
  onChange: (updated: DocumentEvrakSettings) => void
  dosyaFirmalari?: Array<{ id: number; unvan: string }>
  oncekiBelgeler?: Array<{ id: string; baslik?: string; tarih?: string; sayi?: string }>
  onTopluUygulaClick?: () => void
}

export function BelgeAyarlariPaneli({
  selectedBelgeId,
  belgeAdi,
  evrakSettings,
  onChange,
  dosyaFirmalari = [],
  oncekiBelgeler = [],
  onTopluUygulaClick
}: BelgeAyarlariPaneliProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'muhatap' | 'ilgi' | 'ek' | 'dagitim' | 'rota'>(
    'muhatap'
  )

  const template = selectedBelgeId
    ? TemplateRegistryService.getTemplateById(selectedBelgeId)
    : undefined
  const caps = template?.capabilities || {
    supportsMuhatap: true,
    supportsIlgi: true,
    supportsEk: true,
    supportsDagitim: true,
    supportsRota: true
  }
  const workflow = selectedBelgeId
    ? TemplateRegistryService.getWorkflow(selectedBelgeId)
    : undefined

  // Tüm doğrudan temin belgeleri için ayar paneli aktif kabul edilir
  const hasAnyCapability = true

  // Aktif sekmeyi geçerli ilk sekmeye ayarla
  useEffect(() => {
    if (caps?.supportsMuhatap) setActiveTab('muhatap')
    else if (caps?.supportsIlgi) setActiveTab('ilgi')
    else if (caps?.supportsEk) setActiveTab('ek')
  }, [selectedBelgeId, caps?.supportsMuhatap, caps?.supportsIlgi, caps?.supportsEk])

  if (!selectedBelgeId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Settings className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Belge Seçiniz</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
          Resmî yazışma ve evrak ayarlarını düzenlemek için sol listeden bir belge seçin.
        </p>
      </div>
    )
  }

  const isFromProfile = workflow?.explicitState === 'from_profile'
  const routingMode = workflow?.routing?.mode

  // 1. Muhatap Değişikliği
  const handleMuhatapChange = (field: string, val: any) => {
    const currentMuhatap = evrakSettings.muhatap || { hitap: '', hiyerarsi: 'ust' }
    const updatedMuhatap = { ...currentMuhatap, [field]: val }
    const updatedKapanis = kapanisIbaresi(updatedMuhatap.hiyerarsi)
    onChange({
      ...evrakSettings,
      muhatap: updatedMuhatap,
      kapanisIbaresi: updatedKapanis
    })
  }

  // 2. İlgi Ekle / Sil / Onayla
  const handleAddIlgiOneri = (oneri: EvrakIlgiKalemi) => {
    const list = evrakSettings.ilgiListesi || []
    if (list.some((item) => item.id === oneri.id)) return
    onChange({
      ...evrakSettings,
      ilgiListesi: [...list, { ...oneri, onaylandi: true }]
    })
  }

  const handleRemoveIlgi = (id: string) => {
    const list = evrakSettings.ilgiListesi || []
    onChange({
      ...evrakSettings,
      ilgiListesi: list.filter((i) => i.id !== id)
    })
  }

  // 3. Ek Ekle / Sil
  const handleAddEkOneri = (oneri: EvrakEkKalemi) => {
    const list = evrakSettings.ekListesi || []
    if (list.some((item) => item.id === oneri.id)) return
    onChange({
      ...evrakSettings,
      ekListesi: [...list, { ...oneri, onaylandi: true }]
    })
  }

  const handleRemoveEk = (id: string) => {
    const list = evrakSettings.ekListesi || []
    onChange({
      ...evrakSettings,
      ekListesi: list.filter((e) => e.id !== id)
    })
  }

  const ilgiOnerileri = ilgiOner(oncekiBelgeler, selectedBelgeId)
  const ekOnerileri = ekOner('mal_alimi', selectedBelgeId)

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100">
      {/* Panel Başlığı ve Toplu Ayar Aksiyonu */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Belge Ayarları</h2>
          {isFromProfile && (
            <span
              className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-medium"
              title="Bu rota şablon arketip profilinden üretilmiştir, doğrulanmamıştır"
            >
              Varsayılan rota, doğrulanmadı
            </span>
          )}
        </div>
        {onTopluUygulaClick && (
          <button
            type="button"
            onClick={onTopluUygulaClick}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-300 hover:text-white bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 rounded-lg transition-all shadow-xs cursor-pointer"
            title="İmza ve personel ayarlarını dosyadaki tüm uygun belgelere uygular"
          >
            <Users className="w-3.5 h-3.5" />
            Toplu Uygula
          </button>
        )}
      </div>

      {/* Sekmeler (Muhatap | İlgi | Ek | Dağıtım | Rota) */}
      <div
        className="flex border-b border-slate-800 bg-slate-950 px-2 gap-1 overflow-x-auto"
        role="tablist"
      >
        {caps?.supportsMuhatap && (
          <button
            role="tab"
            aria-selected={activeTab === 'muhatap'}
            tabIndex={0}
            onClick={() => setActiveTab('muhatap')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'muhatap'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Muhatap
          </button>
        )}

        {caps?.supportsIlgi && (
          <button
            role="tab"
            aria-selected={activeTab === 'ilgi'}
            tabIndex={0}
            onClick={() => setActiveTab('ilgi')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ilgi'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            İlgi
            {(evrakSettings.ilgiListesi?.length || 0) > 0 && (
              <span className="ml-1 text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/60 px-1.5 py-0.2 rounded-full">
                {evrakSettings.ilgiListesi?.length}
              </span>
            )}
          </button>
        )}

        {caps?.supportsEk && (
          <button
            role="tab"
            aria-selected={activeTab === 'ek'}
            tabIndex={0}
            onClick={() => setActiveTab('ek')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ek'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Ek
            {(evrakSettings.ekListesi?.length || 0) > 0 && (
              <span className="ml-1 text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/60 px-1.5 py-0.2 rounded-full">
                {evrakSettings.ekListesi?.length}
              </span>
            )}
          </button>
        )}

        {/* İskelet Sekmeler (V1'de devre dışı) */}
        <button
          role="tab"
          aria-selected={false}
          disabled
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 cursor-not-allowed border-b-2 border-transparent"
          title="İlk sürümde Dağıtım sekmesi iskelet olarak hazırdır"
        >
          <Share2 className="w-3.5 h-3.5 opacity-60" />
          Dağıtım (Yakında)
        </button>

        <button
          role="tab"
          aria-selected={false}
          disabled
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 cursor-not-allowed border-b-2 border-transparent"
          title="İlk sürümde Rota sekmesi iskelet olarak hazırdır"
        >
          <GitFork className="w-3.5 h-3.5 opacity-60" />
          Rota (Yakında)
        </button>
      </div>

      {/* Sekme İçerikleri */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* SEKME 1: MUHATAP */}
        {activeTab === 'muhatap' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {routingMode === 'firma' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  İstekli / Yüklenici Firma Seçimi
                </label>
                <select
                  value={evrakSettings.muhatap?.hitap || ''}
                  onChange={(e) => handleMuhatapChange('hitap', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">-- Dosyadaki Firmalardan Seçin --</option>
                  {dosyaFirmalari.map((f) => (
                    <option key={f.id} value={f.unvan}>
                      {f.unvan}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Muhatap Kurum Hitabı (Resmî Başlık)
                  </label>
                  <input
                    type="text"
                    value={evrakSettings.muhatap?.hitap || ''}
                    onChange={(e) => handleMuhatapChange('hitap', e.target.value)}
                    placeholder="Örn: ANKARA VALİLİĞİNE (İl Sağlık Müdürlüğü)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Hiyerarşik Düzey
                    </label>
                    <select
                      value={evrakSettings.muhatap?.hiyerarsi || 'ust'}
                      onChange={(e) =>
                        handleMuhatapChange('hiyerarsi', e.target.value as MuhatapHiyerarsi)
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="ust">Üst Makam (Arz ederim)</option>
                      <option value="es">Eş Düzey (Rica ederim)</option>
                      <option value="alt">Alt Birim / Şube (Rica ederim)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gönderim Kanalı
                    </label>
                    <select
                      value={evrakSettings.muhatap?.kanal || 'EBYS'}
                      onChange={(e) =>
                        handleMuhatapChange('kanal', e.target.value as GonderimKanali)
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="EBYS">EBYS (Elektronik Belge)</option>
                      <option value="KEP">KEP (Kayıtlı Elektronik Posta)</option>
                      <option value="ELDEN">Elden / Fiziksel Tebligat</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-blue-300 font-medium">
                    Otomatik Kapanış İbaresi:
                  </span>
                  <span className="text-xs font-bold text-blue-200 bg-slate-950 px-2.5 py-1 rounded-md border border-blue-800/80">
                    {evrakSettings.kapanisIbaresi ||
                      kapanisIbaresi(evrakSettings.muhatap?.hiyerarsi)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEKME 2: İLGİ */}
        {activeTab === 'ilgi' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Eklenmiş İlgiler */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 mb-2">
                Belgeye Eklenen İlgiler ({(evrakSettings.ilgiListesi || []).length})
              </h3>
              {(evrakSettings.ilgiListesi || []).length === 0 ? (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  Henüz ilgi maddesi eklenmedi.
                </div>
              ) : (
                <div className="space-y-2">
                  {evrakSettings.ilgiListesi?.map((ilgi, idx) => (
                    <div
                      key={ilgi.id}
                      className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">
                          {String.fromCharCode(97 + idx)})
                        </span>
                        <span className="text-slate-200">{ilgi.metin}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIlgi(ilgi.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                        title="İlgiyi Kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dosyadaki Belgelerden Öneriler (Onaylayarak Ekleme) */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                Dosyadaki Belgelerden İlgi Önerileri
              </h3>
              {ilgiOnerileri.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Öneri sunulacak önceki belge bulunamadı.
                </p>
              ) : (
                <div className="space-y-2">
                  {ilgiOnerileri.map((oneri) => {
                    const isAdded = (evrakSettings.ilgiListesi || []).some((i) => i.id === oneri.id)
                    return (
                      <div
                        key={oneri.id}
                        className="p-2.5 border border-slate-800 rounded-xl flex items-center justify-between bg-slate-950/50 hover:border-slate-700 transition-all text-xs"
                      >
                        <span className="text-slate-300 pr-2">{oneri.metin}</span>
                        {isAdded ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Eklendi
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddIlgiOneri(oneri)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-300 bg-blue-950/80 border border-blue-800/80 hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ekle
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEKME 3: EK */}
        {activeTab === 'ek' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Eklenmiş Ekler */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 mb-2">
                Belge Ekleri ({(evrakSettings.ekListesi || []).length})
              </h3>
              {(evrakSettings.ekListesi || []).length === 0 ? (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  Henüz ek tanımlanmadı.
                </div>
              ) : (
                <div className="space-y-2">
                  {evrakSettings.ekListesi?.map((ek, idx) => (
                    <div
                      key={ek.id}
                      className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">EK-{idx + 1}:</span>
                        <span className="text-slate-200">{ek.ad}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEk(ek.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                        title="Eki Kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Süreç / Şablon Önerileri */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                Önerilen Ek Dokümanlar
              </h3>
              <div className="space-y-2">
                {ekOnerileri.map((oneri) => {
                  const isAdded = (evrakSettings.ekListesi || []).some((e) => e.id === oneri.id)
                  return (
                    <div
                      key={oneri.id}
                      className="p-2.5 border border-slate-800 rounded-xl flex items-center justify-between bg-slate-950/50 hover:border-slate-700 transition-all text-xs"
                    >
                      <span className="text-slate-300">{oneri.ad}</span>
                      {isAdded ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Eklendi
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddEkOneri(oneri)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-300 bg-amber-950/80 border border-amber-800/80 hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Ekle
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
