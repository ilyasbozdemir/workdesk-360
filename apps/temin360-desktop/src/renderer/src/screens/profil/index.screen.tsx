import React, { useState, useEffect } from 'react'
import { User, Plus, CheckCircle2, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useSettingsStore } from '../../store/settingsStore'
import { useKurumHooks, KurumVerisi } from '../kurum/kurum.hooks'
import { KurumProfilesSection } from './components/KurumProfilesSection'
import { KurumProfileModal } from './components/KurumProfileModal'
import { AdminCredentialsCard } from './components/AdminCredentialsCard'
import { AuditTrailInfoCard } from './components/AuditTrailInfoCard'
import { PasswordHistoryCard, PasswordHistoryItem } from './components/PasswordHistoryCard'

export default function ProfilScreen(): React.JSX.Element {
  const { loadSettings: reloadSettingsStore, activeKurumId } = useSettingsStore()
  const {
    allKurumlar,
    isLoadingKurum,
    fetchKurum,
    createKurumProfile,
    switchActiveKurum,
    deleteKurumProfile,
    saveKurum
  } = useKurumHooks()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile States
  const [adminName, setAdminName] = useState('')
  const [adminTitle, setAdminTitle] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [ekapUsername, setEkapUsername] = useState('')
  const [ekapPassword, setEkapPassword] = useState('')
  const [institutionLogo, setInstitutionLogo] = useState<string | null>(null)
  const [useDesktopUserAsDefault, setUseDesktopUserAsDefault] = useState(false)
  const [pcInfo, setPcInfo] = useState<{
    hostname?: string
    osUsername?: string
    platform?: string
    osType?: string
    userDomain?: string
    suggestedDisplayName?: string
  } | null>(null)

  // Password History States
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistoryItem[]>([])

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingKurum, setEditingKurum] = useState<KurumVerisi | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  const fetchPasswordHistory = async (): Promise<void> => {
    try {
      const res = await window.electron.ipcRenderer.invoke('db:get-password-history')
      if (res?.success && Array.isArray(res.history)) {
        setPasswordHistory(res.history)
      }
    } catch (e) {
      console.error('Failed to load password history:', e)
    }
  }

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const settings = await window.electron.ipcRenderer.invoke('db:get-settings')
        setAdminName(settings.adminName || 'Sistem Yöneticisi')
        setAdminTitle(settings.adminTitle || 'Destek Sorumlusu')
        setAdminUsername(settings.adminUsername || 'admin')
        setAdminPassword(settings.adminPassword || '')
        setEkapUsername(settings.ekapUsername || '')
        setEkapPassword(settings.ekapPassword || '')
        setInstitutionLogo(settings.institutionLogo || null)
        setUseDesktopUserAsDefault(settings.useDesktopUserAsDefault === 'true')

        const info = await window.electron.ipcRenderer
          .invoke('system:get-pc-info')
          .catch(() => null)
        if (info) setPcInfo(info)

        await fetchKurum()
        await fetchPasswordHistory()
      } catch (error) {
        console.error('Profil bilgileri yüklenemedi:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchKurum])

  const showToast = (text: string, type: 'success' | 'error' = 'success'): void => {
    setFeedbackMsg({ text, type })
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const handleSaveCredentials = async (): Promise<void> => {
    setSaving(true)
    try {
      const dataToSave = {
        adminName,
        adminTitle,
        adminUsername,
        adminPassword,
        ekapUsername,
        ekapPassword,
        useDesktopUserAsDefault: String(useDesktopUserAsDefault)
      }
      await window.electron.ipcRenderer.invoke('db:save-settings', dataToSave)
      await reloadSettingsStore()
      await fetchPasswordHistory()
      showToast('Kullanıcı güvenlik ve giriş ayarları başarıyla kaydedildi.', 'success')
    } catch {
      showToast('Ayarlar kaydedilirken hata oluştu!', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenAddModal = (): void => {
    setEditingKurum(null)
    setShowAddModal(true)
  }

  const handleOpenEditModal = (kurum: KurumVerisi): void => {
    setEditingKurum(kurum)
    setShowAddModal(true)
  }

  const handleSaveModal = async (
    formData: Partial<KurumVerisi>,
    switchImmediately: boolean
  ): Promise<void> => {
    if (editingKurum?.id) {
      await saveKurum(formData as KurumVerisi, editingKurum.id)
      showToast(`"${formData.kurum_adi}" profili başarıyla güncellendi.`, 'success')
    } else {
      await createKurumProfile(formData, switchImmediately)
      showToast(
        `"${formData.kurum_adi}" kurumu yeni profil olarak eklendi${
          switchImmediately ? ' ve aktif yapıldı.' : '.'
        }`,
        'success'
      )
    }
  }

  const handleSwitchKurum = async (id: number, name: string): Promise<void> => {
    try {
      await switchActiveKurum(id)
      showToast(`Aktif kurum profili "${name}" olarak değiştirildi.`, 'success')
    } catch (err: any) {
      alert(err.message || 'Geçiş yapılamadı.')
    }
  }

  const handleDeleteKurum = async (id: number, name: string): Promise<void> => {
    if (confirm(`"${name}" kurum profilini silmek istediğinize emin misiniz?`)) {
      try {
        await deleteKurumProfile(id)
        showToast(`"${name}" profili silindi.`, 'success')
      } catch (err: any) {
        alert(err.message || 'Silinemedi.')
      }
    }
  }

  if (loading || isLoadingKurum) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-slate-500 font-medium">
        Yükleniyor...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full pb-16">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-rose-600 text-white shadow-rose-500/20'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          ) : (
            <X className="w-5 h-5 text-rose-100" />
          )}
          {feedbackMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Kullanıcı Profili ve Güvenlik
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Kurum profillerinizi yönetin, birden fazla kurum arasında geçiş yapın ve kullanıcı giriş
            yetkilerini yapılandırın.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAddModal}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-4 text-sm font-semibold shadow-md shadow-blue-500/15"
          >
            <Plus className="w-4 h-4" /> Yeni Kurum Profili Ekle
          </Button>
        </div>
      </div>

      {/* 1. BÖLÜM: TANIMLI KURUM PROFİLLERİ */}
      <KurumProfilesSection
        allKurumlar={allKurumlar}
        activeKurumId={activeKurumId}
        onOpenEditModal={handleOpenEditModal}
        onDeleteKurum={handleDeleteKurum}
        onSwitchKurum={handleSwitchKurum}
      />

      {/* 2. BÖLÜM: YÖNETİCİ & GÜVENLİK BİLGİLERİ */}
      <AdminCredentialsCard
        adminName={adminName}
        setAdminName={setAdminName}
        adminTitle={adminTitle}
        setAdminTitle={setAdminTitle}
        adminUsername={adminUsername}
        setAdminUsername={setAdminUsername}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        ekapUsername={ekapUsername}
        setEkapUsername={setEkapUsername}
        ekapPassword={ekapPassword}
        setEkapPassword={setEkapPassword}
        institutionLogo={institutionLogo}
        saving={saving}
        onSaveCredentials={handleSaveCredentials}
        pcInfo={pcInfo}
        useDesktopUserAsDefault={useDesktopUserAsDefault}
        setUseDesktopUserAsDefault={setUseDesktopUserAsDefault}
      />

      {/* 3. BÖLÜM: DENETİM VE GÜVENLİK İZLEME */}
      <AuditTrailInfoCard />

      {/* 4. BÖLÜM: GEÇMİŞ ŞİFRE VE VERİTABANI KİLİT ARŞİVİ */}
      <PasswordHistoryCard passwordHistory={passwordHistory} adminPassword={adminPassword} />

      {/* YENİ / DÜZENLEME KURUM PROFİLİ MODALI */}
      <KurumProfileModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        editingKurum={editingKurum}
        onSave={handleSaveModal}
      />
    </div>
  )
}
