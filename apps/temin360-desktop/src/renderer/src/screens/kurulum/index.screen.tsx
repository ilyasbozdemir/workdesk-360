import React, { useState, useEffect } from 'react'
import {
  Building2,
  FolderTree,
  Users,
  GitFork,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  Layers
} from 'lucide-react'
import { KurulumFormState } from './types'
import { KurumAdimi } from './components/KurumAdimi'
import { BirimlerAdimi } from './components/BirimlerAdimi'
import { PersonelAdimi } from './components/PersonelAdimi'
import { RotaAdimi } from './components/RotaAdimi'
import { OzetAdimi } from './components/OzetAdimi'
import { useSettingsStore } from '../../store/settingsStore'
import { useTabStore } from '../../store/tabStore'
import { APP_ROUTES } from '../../constants/routeConstants'
import type { RouteAssignee } from '@temin360/contracts'
import {
  saveRotaConfigForTemplate,
  GLOBAL_ROTA_KEY
} from '../../services/rotaDefaultsService'
import {
  syncAndFetchKurulumTakip,
  completeKurulumInDatabase,
  type KurulumTakipItem
} from './kurulumTakipService'
import { TabloTakipPaneli } from './components/TabloTakipPaneli'

const STEPS = [
  { id: 1, title: 'Kurum & Antet', icon: Building2, desc: 'Kurum adı ve resmî antet' },
  { id: 2, title: 'Birimler', icon: FolderTree, desc: 'Harcama müdürlükleri' },
  { id: 3, title: 'Personel Kadrosu', icon: Users, desc: 'Yetkililer ve görevliler' },
  { id: 4, title: 'Onay Rotası', icon: GitFork, desc: 'Varsayılan imza akışı' },
  { id: 5, title: 'Özet & Başlangıç', icon: CheckCircle2, desc: 'Yapılandırma onayı' }
]

export default function KurulumSihirbaziScreen(): React.JSX.Element {
  const { setInstitutionName, loadSettings } = useSettingsStore()
  const { addTab } = useTabStore()

  const [formState, setFormState] = useState<KurulumFormState>({
    step: 1,
    kurum: {
      kurumAdi: '',
      ustKurumAdi: '',
      il: '',
      ilce: '',
      makamAdi: 'BAŞKANLIK MAKAMINA',
      detsisNo: '',
      harcamaBirimAdi: 'Destek Hizmetleri Müdürlüğü'
    },
    birimler: [],
    personeller: [],
    rota: {
      varsayilanHarcamaYetkilisiId: '',
      varsayilanGerceklestirmeId: '',
      varsayilanMuhasebeId: '',
      varsayilanBirimAdi: '',
      limitTipi: 'buyuksehir_olmayan'
    },
    isCompleted: false
  })

  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [takipItems, setTakipItems] = useState<KurulumTakipItem[]>([])

  // Sayfa açıldığında varsa mevcut kurum ve birim bilgilerini önceden çek
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
          const kRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            'SELECT * FROM TANIM_Kurum LIMIT 1'
          )
          if (kRes?.success && kRes?.data?.[0]) {
            const row = kRes.data[0]
            setFormState((prev) => ({
              ...prev,
              kurum: {
                kurumAdi: row.kurum_adi || '',
                ustKurumAdi: row.ust_kurum_adi || '',
                il: row.il || '',
                ilce: row.ilce || '',
                makamAdi: row.makam_adi || 'BAŞKANLIK MAKAMINA',
                detsisNo: row.detsis_kodu || '',
                harcamaBirimAdi: row.harcama_birim_adi || 'Destek Hizmetleri Müdürlüğü'
              }
            }))
          }

          const syncRes = await syncAndFetchKurulumTakip()
          setTakipItems(syncRes.items)
        }
      } catch (err) {
        console.warn('[KurulumSihirbazi] Mevcut veriler çekilemedi:', err)
      }
    }
    fetchExisting()
  }, [])

  const nextStep = () => {
    if (formState.step < 5) {
      setFormState((prev) => ({ ...prev, step: prev.step + 1 }))
    }
  }

  const prevStep = () => {
    if (formState.step > 1) {
      setFormState((prev) => ({ ...prev, step: prev.step - 1 }))
    }
  }

  const handleCompleteSetup = async () => {
    setIsSaving(true)
    try {
      const { kurum, birimler, personeller, rota } = formState

      if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
        const ipc = window.electron.ipcRenderer

        // 1. TANIM_Kurum Güncelle / Ekle
        const checkKurum = await ipc.invoke('db:query', 'SELECT id FROM TANIM_Kurum LIMIT 1')
        if (checkKurum?.success && checkKurum?.data?.length > 0) {
          await ipc.invoke(
            'db:run',
            `UPDATE TANIM_Kurum SET 
              kurum_adi = ?, 
              ust_kurum_adi = ?, 
              il = ?, 
              ilce = ?, 
              makam_adi = ?, 
              detsis_kodu = ?, 
              harcama_birim_adi = ?,
              updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
              kurum.kurumAdi,
              kurum.ustKurumAdi,
              kurum.il,
              kurum.ilce,
              kurum.makamAdi,
              kurum.detsisNo,
              kurum.harcamaBirimAdi,
              checkKurum.data[0].id
            ]
          )
        } else {
          await ipc.invoke(
            'db:run',
            `INSERT INTO TANIM_Kurum (
              kurum_adi, ust_kurum_adi, il, ilce, makam_adi, detsis_kodu, harcama_birim_adi
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              kurum.kurumAdi,
              kurum.ustKurumAdi,
              kurum.il,
              kurum.ilce,
              kurum.makamAdi,
              kurum.detsisNo,
              kurum.harcamaBirimAdi
            ]
          )
        }

        // 2. Birimleri TANIM_Birim'e Ekle
        for (const b of birimler) {
          const checkB = await ipc.invoke(
            'db:query',
            'SELECT id FROM TANIM_Birim WHERE birim_adi = ? OR ad = ?',
            [b.birimAdi, b.birimAdi]
          )
          if (!checkB?.data || checkB.data.length === 0) {
            await ipc.invoke(
              'db:run',
              `INSERT INTO TANIM_Birim (birim_adi, ad, antet_ek_satir, sunum_makami, aktif_mi) 
               VALUES (?, ?, ?, ?, 1)`,
              [b.birimAdi, b.birimAdi, b.antetEkSatir || b.birimAdi, b.sunumMakami || 'BAŞKANLIK MAKAMINA']
            )
          }
        }

        // 3. Personelleri TANIM_Personel'e Ekle
        for (const p of personeller) {
          const checkP = await ipc.invoke(
            'db:query',
            'SELECT id FROM TANIM_Personel WHERE ad_soyad = ?',
            [p.adSoyad]
          )
          if (!checkP?.data || checkP.data.length === 0) {
            await ipc.invoke(
              'db:run',
              `INSERT INTO TANIM_Personel (ad_soyad, unvan, gorev, birim, aktif_mi) 
               VALUES (?, ?, ?, ?, 1)`,
              [p.adSoyad, p.unvan, p.gorev, p.birim]
            )
          }
        }

        // 4. Varsayılan Rota Yapılandırması Kaydı
        const harcamaAssignee: RouteAssignee | null = rota.varsayilanHarcamaYetkilisiId
          ? { id: String(rota.varsayilanHarcamaYetkilisiId), name: String(rota.varsayilanHarcamaYetkilisiId) }
          : null
        const gerceklestirmeAssignee: RouteAssignee | null = rota.varsayilanGerceklestirmeId
          ? { id: String(rota.varsayilanGerceklestirmeId), name: String(rota.varsayilanGerceklestirmeId) }
          : null
        const sunulacakAssignee: RouteAssignee = {
          id: 'makam-1',
          name: kurum.makamAdi || 'BAŞKANLIK MAKAMINA'
        }

        saveRotaConfigForTemplate(GLOBAL_ROTA_KEY, {
          belgeModu: 'standart',
          rota: [],
          birimAdi: rota.varsayilanBirimAdi || kurum.harcamaBirimAdi,
          kurumAdi: kurum.kurumAdi,
          slots: {
            harcamaYetkilisi: harcamaAssignee,
            gerceklestirmeGorevlisi: gerceklestirmeAssignee,
            onaylayan: harcamaAssignee,
            sunulacakMakam: sunulacakAssignee
          }
        })

        // Store güncellemesi
        if (kurum.kurumAdi && typeof setInstitutionName === 'function') setInstitutionName(kurum.kurumAdi)
        if (typeof loadSettings === 'function') await loadSettings()

        // Veritabanı kurulum durumunu mühürle
        await completeKurulumInDatabase()
      }

      setSuccessMessage('Kurulum başarıyla tamamlandı! Çalışma alanına yönlendiriliyorsunuz...')
      setTimeout(() => {
        addTab(APP_ROUTES.DOSYALAR)
      }, 1500)
    } catch (err: any) {
      console.error('[Kurulum Hatası]:', err)
      alert(`Kurulum kaydedilirken bir hata oluştu: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  const isStepValid = () => {
    if (formState.step === 1) {
      return Boolean(formState.kurum.kurumAdi.trim())
    }
    return true
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Header Banner */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              Sistem & Kurum Başlangıç Sihirbazı
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              WorkDesk 360 Kurulum ve İlk Yapılandırma
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kurum kimliğinizi, birimlerinizi, personel kadronuzu ve resmî onay rotanızı adım adım yapılandırın.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Adım {formState.step} / {STEPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="shrink-0 bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const isActive = formState.step === s.id
            const isPassed = formState.step > s.id

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setFormState((prev) => ({ ...prev, step: s.id }))}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                    : isPassed
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isPassed
                        ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span>{s.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {successMessage ? (
            <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                Tebrikler! Kurulum Tamamlandı
              </h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                {successMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {takipItems.length > 0 && (
                <TabloTakipPaneli items={takipItems} compact={formState.step < 5} />
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              {formState.step === 1 && (
                <KurumAdimi
                  data={formState.kurum}
                  onChange={(kurum) => setFormState((prev) => ({ ...prev, kurum }))}
                />
              )}

              {formState.step === 2 && (
                <BirimlerAdimi
                  birimler={formState.birimler}
                  onChange={(birimler) => setFormState((prev) => ({ ...prev, birimler }))}
                />
              )}

              {formState.step === 3 && (
                <PersonelAdimi
                  personeller={formState.personeller}
                  birimler={formState.birimler}
                  onChange={(personeller) => setFormState((prev) => ({ ...prev, personeller }))}
                />
              )}

              {formState.step === 4 && (
                <RotaAdimi
                  rota={formState.rota}
                  birimler={formState.birimler}
                  personeller={formState.personeller}
                  onChange={(rota) => setFormState((prev) => ({ ...prev, rota }))}
                />
              )}

              {formState.step === 5 && (
                <OzetAdimi
                  state={formState}
                  onComplete={handleCompleteSetup}
                  isSaving={isSaving}
                />
              )}

              {/* Navigation Controls */}
              {formState.step < 5 && (
                <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={formState.step === 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Geri
                  </button>

                  <div className="text-xs text-slate-400 font-medium">
                    Adım {formState.step} / {STEPS.length}
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
                  >
                    İleri <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
