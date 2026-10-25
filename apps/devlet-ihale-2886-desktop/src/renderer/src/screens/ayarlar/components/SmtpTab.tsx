import React from 'react'
import { Upload, Download, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface SmtpTabProps {
  smtpHost: string
  setSmtpHost: (val: string) => void
  smtpPort: string
  setSmtpPort: (val: string) => void
  smtpUser: string
  setSmtpUser: (val: string) => void
  smtpPass: string
  setSmtpPass: (val: string) => void
  showSmtpPass: boolean
  setShowSmtpPass: (val: boolean) => void
  smtpSecure: boolean
  setSmtpSecure: (val: boolean) => void
  handleImportSmtp: () => void
  handleExportSmtp: () => void
}

export const SmtpTab: React.FC<SmtpTabProps> = ({
  smtpHost,
  setSmtpHost,
  smtpPort,
  setSmtpPort,
  smtpUser,
  setSmtpUser,
  smtpPass,
  setSmtpPass,
  showSmtpPass,
  setShowSmtpPass,
  smtpSecure,
  setSmtpSecure,
  handleImportSmtp,
  handleExportSmtp
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">
            SMTP Sunucu Ayarları
          </h2>
          <p className="text-xs text-slate-500">
            Şifre sıfırlama kodlarının gönderileceği SMTP ayarları.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleImportSmtp}
            title="SMTP JSON İçe Aktar"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 gap-1.5 text-xs py-1.5 px-3 rounded-lg"
          >
            <Upload className="w-3.5 h-3.5" /> İçe Aktar
          </Button>
          <Button
            onClick={handleExportSmtp}
            title="SMTP JSON Dışa Aktar"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 gap-1.5 text-xs py-1.5 px-3 rounded-lg"
          >
            <Download className="w-3.5 h-3.5" /> Dışa Aktar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
            SMTP Host
          </label>
          <Input
            placeholder="smtp.kurum.bel.tr"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
            SMTP Port
          </label>
          <Input
            placeholder="587"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            className="bg-slate-55 dark:bg-slate-955 border-slate-200 dark:border-slate-800"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1">
            SMTP Kullanıcı Adı (User)
          </label>
          <Input
            placeholder="noreply@kurum.bel.tr"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            className="bg-slate-55 dark:bg-slate-955 border-slate-200 dark:border-slate-800"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 mb-1">
            SMTP Şifre (Password)
          </label>
          <div className="relative">
            <input
              type={showSmtpPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="w-full pr-10 px-3 py-2 text-sm rounded-lg bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowSmtpPass(!showSmtpPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              title={showSmtpPass ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
            >
              {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="md:col-span-3 flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="smtpSecure"
            checked={smtpSecure}
            onChange={(e) => setSmtpSecure(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 bg-slate-55 dark:bg-slate-950 text-primary focus:ring-primary accent-primary"
          />
          <label
            htmlFor="smtpSecure"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            SSL/TLS Bağlantısı (Güvenli)
          </label>
        </div>
      </div>
    </div>
  )
}
