import React from 'react'
import { Building, Eye, EyeOff, Folder, KeyRound, ShieldAlert, User } from 'lucide-react'

interface LauncherCreateModalProps {
  isOpen: boolean
  onClose: () => void
  pendingFilePath: string | null
  onChangeSaveLocation: () => void
  institutionName: string
  onInstitutionNameChange: (val: string) => void
  username: string
  onUsernameChange: (val: string) => void
  password: string
  onPasswordChange: (val: string) => void
  showPassword: boolean
  onToggleShowPassword: () => void
  creating: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function LauncherCreateModal({
  isOpen,
  onClose,
  pendingFilePath,
  onChangeSaveLocation,
  institutionName,
  onInstitutionNameChange,
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  creating,
  onSubmit
}: LauncherCreateModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      className="absolute inset-0 bg-slate-955/40 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl flex flex-col text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Kurum Kayıt Bilgileri
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400">
              Yeni veri dosyası için şifre ve kimlik ayarları
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Dosya Kayıt Konumu
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={pendingFilePath || ''}
                  placeholder="Kayıt konumu seçilmedi..."
                  title={pendingFilePath || ''}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none truncate cursor-default"
                />
              </div>
              <button
                type="button"
                onClick={onChangeSaveLocation}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shrink-0 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Gözat / Değiştir
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Kurum Adı
            </label>
            <input
              type="text"
              required
              value={institutionName}
              onChange={(e) => onInstitutionNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-850 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Yönetici Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-850 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Giriş Parolası
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Parolayı Belirleyin"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-655"
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-none"
                title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-500 text-[10px] leading-relaxed">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>
              Bu şifre veritabanına kaydedilir. İnternet olmasa dahi bu kurum dosyasına girmek için
              bu şifreyi kullanacaksınız. Lütfen unutmayın.
            </span>
          </div>

          <div className="flex gap-3 mt-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-205 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-semibold transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {creating ? 'Oluşturuluyor...' : 'Veri Dosyasını Aç'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
