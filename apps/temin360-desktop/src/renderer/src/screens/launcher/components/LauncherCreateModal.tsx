import React from 'react'
import { Building, Folder, Lock, ShieldAlert, User } from 'lucide-react'

interface LauncherCreateModalProps {
  isOpen: boolean
  onClose: () => void
  pendingFilePath: string | null
  onChangeSaveLocation: () => void
  institutionName: string
  onInstitutionNameChange: (val: string) => void
  username: string
  onUsernameChange: (val: string) => void
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
  creating,
  onSubmit
}: LauncherCreateModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      className="absolute inset-0 bg-slate-955/40 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full rounded-3xl p-6 shadow-2xl flex flex-col text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Yeni Kurum &amp; Çalışma Dosyası Oluştur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yeni kurum için veri dosyası (.temin) ve yönetici profili tanımlama
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Kurum Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Güneyyurt Belediyesi veya Karaman İl Özel İdaresi"
              value={institutionName}
              onChange={(e) => onInstitutionNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Yönetici Kullanıcı Adı <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-850 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              Dosya Kayıt Konumu (.temin)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Folder className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={pendingFilePath || ''}
                  placeholder="Kayıt konumu henüz seçilmedi (Gözat ile belirleyebilirsiniz)..."
                  title={pendingFilePath || ''}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none truncate cursor-default"
                />
              </div>
              <button
                type="button"
                onClick={onChangeSaveLocation}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shrink-0 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {pendingFilePath ? 'Gözat / Değiştir' : 'Konum Seç'}
              </button>
            </div>
          </div>

          {/* E-Posta (SMTP) ve Parola Güvenlik Uyarısı */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-400 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> E-Posta (SMTP) Kurulmadan Parola Belirlenemez
                </h4>
                <p className="text-[11px] leading-relaxed mt-1 text-amber-700 dark:text-amber-300">
                  <span className="font-semibold underline">Zorunlu Güvenlik Kuralı:</span> E-posta sunucusu (SMTP) yapılandırılmadan güvenlik parolası belirlenmesine izin verilmemektedir. E-posta kurulmazsa sistem şifre kurtarma kodu gönderemez ve parolanızı unuttuğunuzda <strong className="font-bold underline text-amber-900 dark:text-amber-200">verilerinizi geliştirici ekibimiz dahil hiç kimse kurtaramaz!</strong>
                </p>
                <p className="text-[10px] leading-relaxed mt-1.5 opacity-90 text-amber-600 dark:text-amber-400">
                  Kurum dosyanızı oluşturup sisteme girdikten sonra, <strong>Ayarlar &gt; E-Posta (SMTP)</strong> sekmesinden e-posta kurulumunu tamamlayarak güvenle parola (en az 6 karakter) belirleyebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
            >
              {creating ? 'Oluşturuluyor...' : 'Kurum Dosyasını Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
