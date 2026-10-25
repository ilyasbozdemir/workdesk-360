import React, { useState } from 'react'
import { Shield, History, KeyRound, Eye, EyeOff, Lock, Save, Laptop, User } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { getInitials } from '@renderer/utils/formatters'

interface AdminCredentialsCardProps {
  adminName: string
  setAdminName: (val: string) => void
  adminTitle: string
  setAdminTitle: (val: string) => void
  adminUsername: string
  setAdminUsername: (val: string) => void
  adminPassword: string
  setAdminPassword: (val: string) => void
  ekapUsername: string
  setEkapUsername: (val: string) => void
  ekapPassword: string
  setEkapPassword: (val: string) => void
  institutionLogo: string | null
  saving: boolean
  onSaveCredentials: () => Promise<void>
  pcInfo?: {
    hostname?: string
    osUsername?: string
    platform?: string
    osType?: string
    userDomain?: string
    suggestedDisplayName?: string
  } | null
  useDesktopUserAsDefault?: boolean
  setUseDesktopUserAsDefault?: (val: boolean) => void
}

export const AdminCredentialsCard: React.FC<AdminCredentialsCardProps> = ({
  adminName,
  setAdminName,
  adminTitle,
  setAdminTitle,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  ekapUsername,
  setEkapUsername,
  ekapPassword,
  setEkapPassword,
  institutionLogo,
  saving,
  onSaveCredentials,
  pcInfo,
  useDesktopUserAsDefault,
  setUseDesktopUserAsDefault
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showEkapPassword, setShowEkapPassword] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sol Kolon - Avatar & Özet Kartı */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center justify-between min-h-[340px]">
        <div className="flex flex-col items-center w-full">
          <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-700 dark:text-slate-200 text-3xl font-bold shadow-inner mb-4 overflow-hidden border-2 border-slate-200 dark:border-slate-700">
            {institutionLogo ? (
              <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              getInitials(adminName)
            )}
          </div>
          <h2
            className="text-lg font-bold text-slate-850 dark:text-slate-100 truncate w-full px-2"
            title={adminName}
          >
            {adminName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {adminTitle || 'Destek Sorumlusu'}
          </p>
        </div>

        <div className="w-full bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-left space-y-2.5 mt-6">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Kullanıcı Adı:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {adminUsername}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Yetki Seviyesi:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Süpervizör / Admin
            </span>
          </div>
          {pcInfo?.osUsername && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Masaüstü Kullanıcısı:</span>
              <span
                className="font-semibold text-slate-700 dark:text-slate-300 font-mono truncate max-w-35"
                title={pcInfo.osUsername}
              >
                {pcInfo.osUsername}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Denetim Altyapısı:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <History className="w-3.5 h-3.5" /> Aktif (Audit BaseTable)
            </span>
          </div>
        </div>
      </div>

      {/* Sağ Kolon - Giriş Bilgileri Formu */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Giriş ve Yönetici
              Bilgileri
            </h3>
            <span className="text-[11px] text-slate-400">
              Uygulama açılışında kimlik doğrulama için kullanılır
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Yönetici Adı Soyadı
              </label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Örn: İlyas Bozdemir"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Makam / Unvan
              </label>
              <Input
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                placeholder="Örn: Muhasebe Müdürü"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Giriş Kullanıcı Adı
              </label>
              <Input
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Giriş Parolası
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* EKAP Entegrasyonu */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-500" /> EKAP Entegrasyon Girişi (Opsiyonel)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  EKAP Kullanıcı Adı
                </label>
                <Input
                  value={ekapUsername}
                  onChange={(e) => setEkapUsername(e.target.value)}
                  placeholder="EKAP Kullanıcı Adı"
                  className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  EKAP Parola
                </label>
                <div className="relative">
                  <Input
                    type={showEkapPassword ? 'text' : 'password'}
                    value={ekapPassword}
                    onChange={(e) => setEkapPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEkapPassword(!showEkapPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showEkapPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Masaüstü ve Cihaz Entegrasyonu */}
          {pcInfo?.hostname && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-500" /> Bilgisayar & Masaüstü Kullanıcı Entegrasyonu
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {pcInfo.hostname} • {pcInfo.platform}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Cihaz / Hostname:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {pcInfo.hostname}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Masaüstü (OS) Kullanıcısı:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {pcInfo.osUsername || 'Bilinmiyor'}
                    </span>
                  </div>
                  {pcInfo.suggestedDisplayName && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 text-[11px] block">
                        Oturum Açma / Karşılama Ekranı Adı (Hoş Geldiniz):
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {pcInfo.suggestedDisplayName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(useDesktopUserAsDefault)}
                      onChange={(e) => setUseDesktopUserAsDefault?.(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Giriş ekranında bu masaüstü kullanıcısını varsayılan yap</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (pcInfo.osUsername) setAdminUsername(pcInfo.osUsername)
                      if (pcInfo.suggestedDisplayName) setAdminName(pcInfo.suggestedDisplayName)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" /> Masaüstü Bilgilerini Forma Aktar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={onSaveCredentials}
              disabled={saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-5 text-sm font-semibold transition-all shadow-md shadow-blue-500/10"
            >
              <Save className="w-4 h-4" /> Bilgileri Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
