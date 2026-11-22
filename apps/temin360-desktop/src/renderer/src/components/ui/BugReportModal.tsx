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
  Lightbulb,
  MessageSquare,
  ShieldCheck
} from 'lucide-react'
import packageJson from '../../../../../package.json'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps): React.JSX.Element | null {
  const [category, setCategory] = useState<'Öneri & İstek' | 'Hata Bildirimi' | 'Görüş & Destek'>('Öneri & İstek')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [sessionEmail, setSessionEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setStatusMessage(null)
      setCopied(false)

      // Sistemdeki oturum / kayıtlı mail adresini otomatik çek
      if (window?.electron?.ipcRenderer) {
        window.electron.ipcRenderer
          .invoke('app:get-user-email')
          .then((res: any) => {
            if (res?.email) {
              setContactEmail(res.email)
              setSessionEmail(res.email)
            }
          })
          .catch(() => {})
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCopyReport = () => {
    const reportText = `=== TEMİN 360 KULLANICI BİLDİRİMİ ===
Tür: ${category}
Başlık: ${title || 'Genel Bildirim'}
Gönderen: ${contactEmail || 'Belirtilmedi'} (Oturum: ${sessionEmail || 'Tanımsız'})
Tarih: ${new Date().toLocaleString('tr-TR')}
Versiyon: v${packageJson.version}

MESAJ / ÖNERİ:
${description || '(Mesaj girilmedi)'}
`
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      })
    }
  }

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(`[TEMİN 360 ${category}] ${title || 'Kullanıcı Bildirimi'}`)
    const body = encodeURIComponent(
      `Gönderen: ${contactEmail || 'Belirtilmedi'}\n\nMesaj:\n${description}\n\nUygulama: v${packageJson.version}`
    )
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
      setStatusMessage({ type: 'error', text: 'Lütfen iletmek istediğiniz öneri veya hata açıklamasını yazınız.' })
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
        contactEmail: contactEmail.trim() || sessionEmail || undefined,
        systemInfo: {
          'Versiyon': `v${packageJson.version}`,
          'Gönderen Hesap': contactEmail || sessionEmail || 'Anonim',
          'Tarih': new Date().toLocaleString('tr-TR')
        }
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Mesajınız geliştirici ekibine e-posta ile başarıyla iletildi. Teşekkür ederiz!'
        })
        setTimeout(() => {
          onClose()
        }, 2200)
      } else if (res.reason === 'no_smtp') {
        setStatusMessage({
          type: 'info',
          text: 'Sistemde henüz otomatik SMTP kurulu değil. "Mail İstemcisi" butonuyla e-posta programınızdan (Outlook / Thunderbird vb.) anında gönderebilirsiniz.'
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: `E-posta gönderimi tamamlanamadı: ${res.error || res.message || 'Bilinmeyen hata'}`
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık Alanı */}
        <div className="relative p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Öneri &amp; Destek Bildirimi</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white/20 border border-white/25">
                  v{packageJson.version}
                </span>
              </h3>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Önerilerinizi, taleplerinizi veya karşılaştığınız sorunları doğrudan bize iletin
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

        {/* Form İçeriği */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Kategori Seçici */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Bildirim Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('Öneri & İstek')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'Öneri & İstek'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Öneri &amp; İstek</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Hata Bildirimi')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'Hata Bildirimi'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Bug className="w-3.5 h-3.5 text-rose-500" />
                <span>Hata Bildir</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Görüş & Destek')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'Görüş & Destek'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Görüş &amp; Mesaj</span>
              </button>
            </div>
          </div>

          {/* Oturum Açılı Gönderen Hesap */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Gönderen E-Posta
              </label>
              {sessionEmail && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Oturum Açık Hesap</span>
                </span>
              )}
            </div>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="E-posta adresiniz (geri dönüş için)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Konu / Başlık */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Konu / Başlık (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Dosya Evrak Akışında yeni bir öneri"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Mesaj / Açıklama */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Mesajınız / Öneriniz <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Önerinizi, aklınıza gelen fikri veya yaşadığınız bir sıkıntıyı kısaca buraya yazınız..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all leading-relaxed"
              required
            />
          </div>

          {/* Durum Bildirimi */}
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

          {/* Alt Butonlar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all font-bold flex items-center gap-1.5 cursor-pointer text-[11px]"
                title="Yazdığınız metni panoya kopyala"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMailto}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all font-bold flex items-center gap-1.5 cursor-pointer text-[11px]"
                title="Varsayılan posta istemcisiyle (Outlook vb.) aç"
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
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 text-xs"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{loading ? 'İletiliyor...' : 'Mail Gönder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
