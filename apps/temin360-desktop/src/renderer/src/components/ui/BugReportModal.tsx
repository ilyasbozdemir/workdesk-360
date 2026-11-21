import React, { useState, useEffect } from 'react'
import {
  Bug,
  Send,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  HelpCircle,
  Lightbulb,
  FileText,
  ExternalLink
} from 'lucide-react'
import packageJson from '../../../../../package.json'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps): React.JSX.Element | null {
  const [category, setCategory] = useState<'Hata Bildirimi' | 'Özellik Talebi' | 'Teknik Destek'>('Hata Bildirimi')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true)
  const [includeLogs, setIncludeLogs] = useState(true)
  const [recentLogs, setRecentLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setStatusMessage(null)
      setCopied(false)

      // Son logları getir
      if (window?.electron?.ipcRenderer) {
        window.electron.ipcRenderer
          .invoke('logs:read-recent', 80)
          .then((logs: string) => {
            setRecentLogs(logs || '')
          })
          .catch(() => {
            setRecentLogs('')
          })
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const systemInfo = {
    'Uygulama Versiyonu': `v${packageJson.version}`,
    'İşletim Sistemi': typeof navigator !== 'undefined' ? navigator.userAgent : 'Bilinmiyor',
    'Platform': typeof process !== 'undefined' ? process.platform : 'win32',
    'Ekran Çözünürlüğü': typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Bilinmiyor',
    'Tarih': new Date().toLocaleString('tr-TR')
  }

  const handleCopyReport = () => {
    const reportText = `=== TEMİN 360 DESTEK & HATA BİLDİRİMİ ===
Kategori: ${category}
Başlık: ${title || 'Belirtilmedi'}
İletişim: ${contactEmail || 'Belirtilmedi'}
Tarih: ${new Date().toLocaleString('tr-TR')}

AÇIKLAMA:
${description || '(Açıklama girilmedi)'}

${includeSystemInfo ? `SİSTEM BİLGİLERİ:\n${Object.entries(systemInfo).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n` : ''}
${includeLogs && recentLogs ? `SON HATA GÜNLÜKLERİ:\n${recentLogs.slice(-1500)}` : ''}
`
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      })
    }
  }

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(`[TEMİN 360 ${category}] ${title || 'Destek Talebi'}`)
    const body = encodeURIComponent(`Açıklama:\n${description}\n\nİletişim: ${contactEmail || 'Belirtilmedi'}\n\nUygulama: v${packageJson.version}\nPlatform: ${systemInfo['Platform']}`)
    const mailtoUrl = `mailto:bozdemir.ib70@gmail.com?subject=${subject}&body=${body}`

    try {
      if (window?.electron?.shell?.openExternal) {
        window.electron.shell.openExternal(mailtoUrl)
      } else {
        window.open(mailtoUrl, '_blank')
      }
    } catch {
      window.open(mailtoUrl, '_blank')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setStatusMessage({ type: 'error', text: 'Lütfen karşılaştığınız sorunu veya talebinizi açıklayınız.' })
      return
    }

    setLoading(true)
    setStatusMessage(null)

    try {
      if (!window?.electron?.ipcRenderer) {
        throw new Error('Elektron IPC köprüsü bulunamadı.')
      }

      const res = await window.electron.ipcRenderer.invoke('app:send-bug-report', {
        category,
        title: title.trim() || `${category} - ${new Date().toLocaleDateString('tr-TR')}`,
        description: description.trim(),
        contactEmail: contactEmail.trim() || undefined,
        systemInfo: includeSystemInfo ? systemInfo : undefined,
        logs: includeLogs && recentLogs ? recentLogs.slice(-2000) : undefined
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Bildiriminiz geliştirici ekibine e-posta ile başarıyla gönderildi. Teşekkür ederiz!'
        })
      } else if (res.reason === 'no_smtp') {
        setStatusMessage({
          type: 'info',
          text: 'Yerel SMTP sunucusu yapılandırılmamış. Aşağıdaki butonla varsayılan e-posta istemcinizi (Outlook vb.) kullanarak gönderebilirsiniz.'
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: `E-posta gönderilemedi: ${res.error || res.message || 'Bilinmeyen hata'}`
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gönderim hatası: ${err?.message || String(err)}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Hata & Destek Bildirimi</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white/20 border border-white/25">
                  v{packageJson.version}
                </span>
              </h3>
              <p className="text-xs text-rose-100/90 mt-0.5">
                Sorunları, eksikleri veya taleplerinizi doğrudan geliştiriciye iletin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Bildirim Türü */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Bildirim Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('Hata Bildirimi')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'Hata Bildirimi'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Hata (Bug)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Özellik Talebi')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'Özellik Talebi'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Özellik Talebi</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Teknik Destek')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'Teknik Destek'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Destek</span>
              </button>
            </div>
          </div>

          {/* Konu / Başlık */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Konu / Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Dosya Evrak Akışında yazdırma butonu çalışmadı"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Hata / Talep Açıklaması <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ne yaparken karşılaştınız? Beklenen davranış neydi? Adım adım açıklayınız..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all leading-relaxed"
              required
            />
          </div>

          {/* İletişim E-Postası */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              İletişim E-Postası (İsteğe Bağlı)
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Geri dönüş yapabilmemiz için e-posta adresiniz"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Ekler (Sistem Bilgileri & Loglar) */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSystemInfo}
                onChange={(e) => setIncludeSystemInfo(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Sistem ve Donanım Bilgilerini Ekle (OS, Ekran, Versiyon)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Uygulama Hata Günlüklerini (Son Loglar) Ekle
              </span>
            </label>
          </div>

          {/* Durum Mesajı */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : statusMessage.type === 'info'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11px] leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                title="Tüm raporu panoya kopyala"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMailto}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                title="Varsayılan e-posta istemcisiyle aç"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mail İstemcisi</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer text-xs"
              >
                Kapat
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 text-xs"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{loading ? 'Gönderiliyor...' : 'E-Posta Gönder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
