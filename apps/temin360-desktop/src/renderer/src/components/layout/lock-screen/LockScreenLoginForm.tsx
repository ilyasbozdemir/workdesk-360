import React from 'react'
import { Eye, EyeOff, KeyRound, ShieldAlert, User } from 'lucide-react'

interface LockScreenLoginFormProps {
  isSetupMode: boolean
  username: string
  setUsername: (val: string) => void
  password: string
  setPassword: (val: string) => void
  showPassword: boolean
  setShowPassword: (val: boolean) => void
  rememberMe: boolean
  setRememberMe: (val: boolean) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onForgotPassword: () => void
  recentUsers?: string[]
  pcInfo?: {
    hostname?: string
    osUsername?: string
    platform?: string
    osType?: string
    userDomain?: string
    suggestedDisplayName?: string
  }
}

export function LockScreenLoginForm({
  isSetupMode,
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  loading,
  onSubmit,
  onForgotPassword,
  recentUsers = [],
  pcInfo
}: LockScreenLoginFormProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Windows / Sistem Oturumu Karşılama Kartı (Hoş Geldiniz [İsim]) */}
      <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/80 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-indigo-950/30 border border-blue-200/70 dark:border-blue-800/50 rounded-2xl shadow-xs">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 font-bold text-base">
          {pcInfo?.suggestedDisplayName
            ? pcInfo.suggestedDisplayName.charAt(0).toLocaleUpperCase('tr-TR')
            : (username || 'U').charAt(0).toLocaleUpperCase('tr-TR')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <span>Hoş Geldiniz</span>
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
            {pcInfo?.suggestedDisplayName || pcInfo?.osUsername || (username === 'admin' ? 'Yönetici' : username)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
            <span>💻 {pcInfo?.hostname || 'Masaüstü'}</span>
            {pcInfo?.osUsername && <span>• {pcInfo.osUsername}</span>}
          </div>
        </div>
        {pcInfo?.osUsername && username !== pcInfo.osUsername && (
          <button
            type="button"
            onClick={() => setUsername(pcInfo.osUsername!)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 hover:bg-blue-200/60 dark:hover:bg-blue-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Kullanıcı adını masaüstü hesabına ayarla"
          >
            Seç
          </button>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Kullanıcı Adı
          </label>
          {pcInfo?.osUsername && (
            <button
              type="button"
              onClick={() => setUsername(pcInfo.osUsername!)}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              title="Bu bilgisayarın masaüstü kullanıcı adını kullan"
            >
              💻 Masaüstü: {pcInfo.osUsername}
            </button>
          )}
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
          <input
            type="text"
            required
            placeholder="Kullanıcı Adı"
            list="recent-usernames-list"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
          />
          {recentUsers.length > 0 && (
            <datalist id="recent-usernames-list">
              {recentUsers.map((user) => (
                <option key={user} value={user} />
              ))}
            </datalist>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
          {isSetupMode ? 'Yeni Parola' : 'Parola'}
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 focus:outline-none cursor-pointer"
            title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isSetupMode && (
        <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-550 text-[10px] leading-relaxed">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Bu şifre veritabanına kaydedilir. İnternet olmasa dahi bu kurum dosyasına girmek için bu
            şifreyi kullanacaksınız. Lütfen unutmayın.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 px-1">
        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500/50"
          />
          Beni Hatırla
        </label>
        {!isSetupMode && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-blue-650 dark:text-blue-500 hover:underline transition-colors focus:outline-none font-medium cursor-pointer"
          >
            Şifremi Unuttum
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
      >
        {loading
          ? isSetupMode
            ? 'Kaydediliyor...'
            : 'Doğrulanıyor...'
          : isSetupMode
            ? 'Şifre Belirle ve Giriş Yap'
            : 'Giriş Yap ve Kilidi Aç'}
      </button>
    </form>
  )
}
