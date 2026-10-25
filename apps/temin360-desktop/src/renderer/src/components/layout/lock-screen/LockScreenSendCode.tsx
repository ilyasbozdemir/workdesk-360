import React from 'react'
import { Mail } from 'lucide-react'

interface LockScreenSendCodeProps {
  loading: boolean
  email: string
  setEmail: (val: string) => void
  onSendCode: () => void
  onCancel: () => void
}

export function LockScreenSendCode({
  loading,
  email,
  setEmail,
  onSendCode,
  onCancel
}: LockScreenSendCodeProps): React.JSX.Element {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSendCode()
      }}
    >
      <p className="text-slate-650 dark:text-slate-300 text-xs leading-relaxed">
        Parolanızı sıfırlamak için kayıtlı e-posta adresinizi girin. Adres kayıtlıysa tek
        kullanımlık, 10 dakika geçerli 6 haneli bir doğrulama kodu gönderilir. Çalışma dosyalarınız
        bu işlemden etkilenmez.
      </p>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
          Kayıtlı E-posta Adresi
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-555" />
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="ornek@kurum.gov.tr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
      >
        {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-305 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
      >
        Giriş Ekranına Dön
      </button>
    </form>
  )
}
