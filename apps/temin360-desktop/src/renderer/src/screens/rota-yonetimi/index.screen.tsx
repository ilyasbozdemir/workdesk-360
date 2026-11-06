import React, { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Compass,
  FileText,
  FolderOpen,
  GitFork,
  Globe,
  RotateCcw,
  Save,
  Sparkles,
  Users
} from 'lucide-react'
import { buildMergedPersonelList, cleanPersonelName, toTrDate } from '@temin360/document-templates'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { TEMPLATE_OPTIONS } from '../dosya/components/DocumentPreviewModalV3/templateResolver'
import {
  DOCUMENT_STAGES,
  filterTemplatesByStage
} from '../dosya/components/DocumentPreviewModalV3/stages'
import {
  DocumentPreviewRotaSection,
  BelgeModuType,
  RotaAdimItem
} from '../dosya/components/DocumentPreviewModalV3/components/DocumentPreviewRotaSection'
import {
  GLOBAL_ROTA_KEY,
  applyRotaConfigToAllTemplates,
  getAllSavedRotaConfigs,
  getDirectRotaConfig,
  getRotaConfigForTemplate,
  removeRotaConfigForTemplate,
  saveRotaConfigForTemplate
} from '../../services/rotaDefaultsService'

export default function RotaYonetimiScreen(): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()
  const [scopeMode, setScopeMode] = useState<'global' | 'dosya'>(() =>
    activeDosyaId ? 'dosya' : 'global'
  )
  const effectiveDosyaId = scopeMode === 'dosya' && activeDosyaId ? activeDosyaId : null

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(GLOBAL_ROTA_KEY)
  const [selectedStageId, setSelectedStageId] = useState<number | 'all'>('all')
  const [personelListesi, setPersonelListesi] = useState<any[]>([])
  const [birimListesi, setBirimListesi] = useState<any[]>([])
  const [dosyaInfo, setDosyaInfo] = useState<any>(null)
  const [savedConfigs, setSavedConfigs] = useState<Record<string, any>>(() =>
    getAllSavedRotaConfigs()
  )
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Veritabanından personel, birim ve aktif dosya bilgilerini yükle
  useEffect(() => {
    let mounted = true
    const loadDbData = async () => {
      try {
        const ipc = (window as any)?.electron?.ipcRenderer
        if (!ipc) return

        const [pRes, bRes] = await Promise.all([
          ipc.invoke('db:query', 'SELECT * FROM TANIM_Personel WHERE aktif_mi = 1 ORDER BY ad_soyad ASC'),
          ipc.invoke('db:query', 'SELECT * FROM TANIM_Birim WHERE aktif_mi = 1 ORDER BY birim_adi ASC')
        ])

        if (!mounted) return
        if (pRes?.success && Array.isArray(pRes.data)) {
          setPersonelListesi(pRes.data)
        }
        if (bRes?.success && Array.isArray(bRes.data)) {
          setBirimListesi(bRes.data)
        }

        if (activeDosyaId) {
          const dRes = await ipc.invoke(
            'db:query',
            'SELECT * FROM DATA_TeminDosyasi WHERE id = ?',
            [activeDosyaId]
          )
          if (mounted && dRes?.success && dRes.data?.[0]) {
            setDosyaInfo(dRes.data[0])
          }
        }
      } catch (err) {
        console.error('Rota yönetimi verileri yüklenemedi:', err)
      }
    }
    loadDbData()
    return () => {
      mounted = false
    }
  }, [activeDosyaId])

  // Kayıtlı rota değişikliklerini dinle
  useEffect(() => {
    const refresh = () => setSavedConfigs(getAllSavedRotaConfigs())
    window.addEventListener('temin360:rota-defaults-updated', refresh)
    return () => window.removeEventListener('temin360:rota-defaults-updated', refresh)
  }, [])

  // Seçili şablon veya kapsam değiştiğinde formData'yı yükle
  const [formData, setFormData] = useState<any>(() => {
    const initial = getRotaConfigForTemplate(GLOBAL_ROTA_KEY, effectiveDosyaId)
    return {
      belgeModu: initial?.belgeModu || 'standart',
      rota: initial?.rota || [],
      hazirlayanPersonelAdi: initial?.hazirlayanPersonelAdi || '',
      hazirlayanPersonelUnvan: initial?.hazirlayanPersonelUnvan || '',
      onaylayanPersonelAdi: initial?.onaylayanPersonelAdi || '',
      onaylayanPersonelUnvan: initial?.onaylayanPersonelUnvan || '',
      olurYazisi: initial?.olurYazisi ?? true
    }
  })

  useEffect(() => {
    const conf = getRotaConfigForTemplate(selectedTemplateId, effectiveDosyaId)
    setFormData({
      belgeModu: conf?.belgeModu || 'standart',
      rota: conf?.rota || [],
      hazirlayanPersonelAdi: conf?.hazirlayanPersonelAdi || '',
      hazirlayanPersonelUnvan: conf?.hazirlayanPersonelUnvan || '',
      onaylayanPersonelAdi: conf?.onaylayanPersonelAdi || '',
      onaylayanPersonelUnvan: conf?.onaylayanPersonelUnvan || '',
      olurYazisi: conf?.olurYazisi ?? true
    })
  }, [selectedTemplateId, effectiveDosyaId, savedConfigs])

  const mergedPersonel = useMemo(
    () =>
      buildMergedPersonelList(
        personelListesi,
        {
          ...dosyaInfo,
          hazirlayanPersonelAdi: formData.hazirlayanPersonelAdi,
          hazirlayanPersonelUnvan: formData.hazirlayanPersonelUnvan,
          onaylayanPersonelAdi: formData.onaylayanPersonelAdi,
          onaylayanPersonelUnvan: formData.onaylayanPersonelUnvan,
          rota: formData.rota
        },
        null,
        null
      ),
    [personelListesi, dosyaInfo, formData]
  )

  const filteredTemplates = useMemo(() => {
    if (selectedStageId === 'all') return TEMPLATE_OPTIONS
    return filterTemplatesByStage(selectedStageId, TEMPLATE_OPTIONS)
  }, [selectedStageId])

  const activeTemplateTitle = useMemo(() => {
    if (selectedTemplateId === GLOBAL_ROTA_KEY) {
      return 'Tüm Belgeler İçin Genel Varsayılan Rota'
    }
    const found = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplateId)
    return found?.title || selectedTemplateId
  }, [selectedTemplateId])

  const handleSaveCurrent = () => {
    saveRotaConfigForTemplate(
      selectedTemplateId,
      {
        belgeModu: (formData.belgeModu as BelgeModuType) || 'standart',
        rota: (formData.rota as RotaAdimItem[]) || [],
        hazirlayanPersonelAdi: formData.hazirlayanPersonelAdi,
        hazirlayanPersonelUnvan: formData.hazirlayanPersonelUnvan,
        onaylayanPersonelAdi: formData.onaylayanPersonelAdi,
        onaylayanPersonelUnvan: formData.onaylayanPersonelUnvan,
        olurYazisi: formData.olurYazisi
      },
      effectiveDosyaId
    )
    showToast(
      selectedTemplateId === GLOBAL_ROTA_KEY
        ? 'Genel varsayılan rota kaydedildi'
        : `"${activeTemplateTitle}" için varsayılan rota kaydedildi`
    )
  }

  const handleApplyToAll = () => {
    applyRotaConfigToAllTemplates(
      TEMPLATE_OPTIONS.map((t) => t.id),
      {
        belgeModu: (formData.belgeModu as BelgeModuType) || 'standart',
        rota: (formData.rota as RotaAdimItem[]) || [],
        hazirlayanPersonelAdi: formData.hazirlayanPersonelAdi,
        hazirlayanPersonelUnvan: formData.hazirlayanPersonelUnvan,
        onaylayanPersonelAdi: formData.onaylayanPersonelAdi,
        onaylayanPersonelUnvan: formData.onaylayanPersonelUnvan,
        olurYazisi: formData.olurYazisi
      },
      effectiveDosyaId
    )
    showToast('Rota ve personel ayarları tüm 30 belge şablonuna varsayılan olarak uygulandı!')
  }

  const handleResetCurrent = () => {
    removeRotaConfigForTemplate(selectedTemplateId, effectiveDosyaId)
    showToast('Seçili şablonun özel rota ayarı sıfırlandı')
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Üst Başlık ve Kapsam Seçici */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Merkezi Belge Rota &amp; Onay Akışı Yönetimi</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-bold">
                OTOMATİK VARSAYILAN
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belgeler açıldığında otomatik gelecek olan varsayılan imza, paraf, koordinasyon rotası
              ve görevli personelleri şablon bazında yapılandırın.
            </p>
          </div>
        </div>

        {/* Kapsam Seçimi: Genel Kurum vs Aktif Dosya */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setScopeMode('global')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'global'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Genel Varsayılan</span>
            </button>
            {activeDosyaId && (
              <button
                type="button"
                onClick={() => setScopeMode('dosya')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scopeMode === 'dosya'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Aktif Dosya (#{activeDosyaId})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bildirim Toast */}
      {toastMsg && (
        <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Ana İçerik: Sol Şablon Listesi + Sağ Rota ve Personel Yapılandırma */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* SOL PANEL: Şablon Seçici */}
        <div className="col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Genel Varsayılan Kartı */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTemplateId(GLOBAL_ROTA_KEY)}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                selectedTemplateId === GLOBAL_ROTA_KEY
                  ? 'bg-purple-50/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    🌐 Tüm Belgeler İçin Genel Varsayılan Rota
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Özel ayarı olmayan tüm şablonlar bu rotayı otomatik kullanır
                  </div>
                </div>
              </div>
              {selectedTemplateId === GLOBAL_ROTA_KEY && (
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
              )}
            </button>
          </div>

          {/* Aşama Filtreleri */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Aşamaya Göre Belgeler
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedStageId('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  selectedStageId === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tümü ({TEMPLATE_OPTIONS.length})
              </button>
              {DOCUMENT_STAGES.map((stg) => (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => setSelectedStageId(stg.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedStageId === stg.id
                      ? `${stg.badgeBg} ${stg.badgeText} ring-1 ring-blue-500/30`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {stg.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Şablon Listesi */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-0">
            {filteredTemplates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId
              const directConf = getDirectRotaConfig(tpl.id, effectiveDosyaId)
              const resolvedConf = getRotaConfigForTemplate(tpl.id, effectiveDosyaId)
              const mode = resolvedConf?.belgeModu || 'standart'

              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{tpl.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{tpl.categoryLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {directConf ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                        Özel ({directConf.belgeModu === 'koordinasyonlu' ? 'Rotalı' : directConf.belgeModu})
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {mode === 'koordinasyonlu' ? '🔀 Genel Rotalı' : 'Standart'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SAĞ PANEL: Seçili Şablon İçin Varsayılan Personel & Rota Düzenleyici */}
        <div className="col-span-7 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Sağ Üst Başlık ve Kaydet Aksiyonları */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Yapılandırılan Hedef
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {activeTemplateTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCurrent}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Özel ayarı sil ve genel varsayılana dön"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Bu ayarları tüm 30 şablona uygula"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Tüm Belgelere Uygula</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Varsayılan Olarak Kaydet</span>
              </button>
            </div>
          </div>

          {/* Sağ Gövde: Varsayılan İmza Personelleri + DocumentPreviewRotaSection */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar min-h-0">
            {/* Varsayılan Hazırlayan ve Onaylayan Personel Seçimi (Birleştirilmiş Havuz) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Belge Varsayılan İmza &amp; Onay Görevlileri
                  </span>
                </div>
                {birimListesi.length > 0 && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {birimListesi.length} Aktif Birim &bull; {mergedPersonel.length} Birleştirilmiş
                    Personel
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Hazırlayan Personel */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    1. Hazırlayan / Düzenleyen Personel
                  </label>
                  <select
                    value={
                      mergedPersonel.find(
                        (p) =>
                          cleanPersonelName(p.ad_soyad).toLowerCase() ===
                          cleanPersonelName(formData.hazirlayanPersonelAdi).toLowerCase()
                      )?.id || ''
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      const p = mergedPersonel.find(
                        (item) => String(item.id || item.ad_soyad) === val
                      )
                      if (p) {
                        setFormData((prev: any) => ({
                          ...prev,
                          hazirlayanPersonelAdi: p.ad_soyad,
                          hazirlayanPersonelUnvan: p.unvan || prev.hazirlayanPersonelUnvan
                        }))
                      }
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer"
                  >
                    <option value="">👤 Birleştirilmiş Havuzdan Seç...</option>
                    {mergedPersonel.map((p, idx) => (
                      <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={formData.hazirlayanPersonelAdi || ''}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          hazirlayanPersonelAdi: e.target.value
                        }))
                      }
                      placeholder="Adı Soyadı"
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      value={formData.hazirlayanPersonelUnvan || ''}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          hazirlayanPersonelUnvan: e.target.value
                        }))
                      }
                      placeholder="Unvanı"
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Onaylayan Personel */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    2. Onaylayan / Harcama Yetkilisi (OLUR)
                  </label>
                  <select
                    value={
                      mergedPersonel.find(
                        (p) =>
                          cleanPersonelName(p.ad_soyad).toLowerCase() ===
                          cleanPersonelName(formData.onaylayanPersonelAdi).toLowerCase()
                      )?.id || ''
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      const p = mergedPersonel.find(
                        (item) => String(item.id || item.ad_soyad) === val
                      )
                      if (p) {
                        setFormData((prev: any) => ({
                          ...prev,
                          onaylayanPersonelAdi: p.ad_soyad,
                          onaylayanPersonelUnvan: p.unvan || prev.onaylayanPersonelUnvan
                        }))
                      }
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer"
                  >
                    <option value="">👤 Birleştirilmiş Havuzdan Seç...</option>
                    {mergedPersonel.map((p, idx) => (
                      <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={formData.onaylayanPersonelAdi || ''}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          onaylayanPersonelAdi: e.target.value
                        }))
                      }
                      placeholder="Adı Soyadı"
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      value={formData.onaylayanPersonelUnvan || ''}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          onaylayanPersonelUnvan: e.target.value
                        }))
                      }
                      placeholder="Unvanı"
                      className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rota ve Koordinasyon Yapılandırıcı */}
            <DocumentPreviewRotaSection
              formData={formData}
              setFormData={setFormData}
              personelListesi={mergedPersonel}
              supportsOlur={true}
              templateId={selectedTemplateId}
              dosyaId={effectiveDosyaId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

