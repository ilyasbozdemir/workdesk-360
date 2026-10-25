import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Zap, MessageSquare, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import type {
  AIFormContext,
  AIFilledValues,
  ChatMessage,
  AIFormFillModalProps
} from './ai-form-fill/aiFormFill.types'
import {
  buildQuickFillPrompt,
  buildChatSystemPrompt,
  tryParseApplyBlock,
  tryParseJson
} from './ai-form-fill/aiFormFill.utils'
import { AIFormFillQuickView } from './ai-form-fill/AIFormFillQuickView'
import { AIFormFillChatView } from './ai-form-fill/AIFormFillChatView'

export type { AIFormContext, AIFilledValues }

export function AIFormFillModal({ isOpen, onClose, context, onApply }: AIFormFillModalProps) {
  const [mode, setMode] = useState<'select' | 'quick' | 'chat'>('select')

  // Quick fill state
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickResult, setQuickResult] = useState<AIFilledValues | null>(null)
  const [quickError, setQuickError] = useState('')

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatPendingApply, setChatPendingApply] = useState<AIFilledValues | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setMode('select')
      setQuickResult(null)
      setQuickError('')
      setChatMessages([])
      setChatPendingApply(null)
      setChatInput('')
    }
  }, [isOpen])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── Quick Fill ──────────────────────────────────────────────────────────────
  const handleQuickFill = async () => {
    setQuickLoading(true)
    setQuickResult(null)
    setQuickError('')
    try {
      const prompt = buildQuickFillPrompt(context)
      const res = await window.api.aiGenerate({ prompt })
      if (res.success && res.data) {
        const parsed = tryParseJson(res.data)
        if (parsed) {
          setQuickResult(parsed)
        } else {
          setQuickError('AI geçerli bir JSON döndürmedi. Tekrar deneyin.')
        }
      } else {
        setQuickError(
          res.error || 'AI hatası. Ayarlar > Yapay Zeka bölümünden API anahtarınızı kontrol edin.'
        )
      }
    } catch {
      setQuickError('Beklenmeyen hata oluştu.')
    } finally {
      setQuickLoading(false)
    }
  }

  // ── Chat ────────────────────────────────────────────────────────────────────
  const handleChatStart = () => {
    setMode('chat')
    const welcome: ChatMessage = {
      role: 'assistant',
      content: `Merhaba! Ben TEMİN 360 Asistanınızım 👋\n\n**${context.formTitle}** formunu doldurmana yardımcı olabilirim.\n\nHızlı bir şekilde doldurmak için bana şunu söyle:\n> "X malzemesi alımı için doğrudan temin dosyası aç"\n\nYa da adım adım gidelim — hangi birimin alımı bu?`,
      timestamp: new Date()
    }
    setChatMessages([welcome])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const systemPrompt = buildChatSystemPrompt(context)
      const history = [...chatMessages, userMsg]
      const conversationText = history
        .map((m) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`)
        .join('\n\n')

      const prompt = `${systemPrompt}\n\n--- SOHBET GEÇMİŞİ ---\n${conversationText}\n\nAsistan:`
      const res = await window.api.aiGenerate({ prompt })

      if (res.success && res.data) {
        const aiText = res.data.trim()
        const applyValues = tryParseApplyBlock(aiText)
        const cleanText = aiText.replace(/<APPLY>[\s\S]*?<\/APPLY>/, '').trim()

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: cleanText || 'Form değerleri hazır! Aşağıdan uygulayabilirsin.',
          timestamp: new Date()
        }
        setChatMessages((prev) => [...prev, assistantMsg])

        if (applyValues) {
          setChatPendingApply(applyValues)
        }
      } else {
        const errMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ Hata: ${res.error || 'AI yanıt vermedi.'}`,
          timestamp: new Date()
        }
        setChatMessages((prev) => [...prev, errMsg])
      }
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: '⚠️ Beklenmeyen hata oluştu.',
        timestamp: new Date()
      }
      setChatMessages((prev) => [...prev, errMsg])
    } finally {
      setChatLoading(false)
    }
  }

  const handleApplyAndClose = (values: AIFilledValues) => {
    onApply(values)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300',
          mode === 'chat' ? 'max-w-2xl h-[85vh]' : 'max-w-xl'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                AI ile Forma Yardım
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{context.formTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Mode Select ── */}
        {mode === 'select' && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formu nasıl doldurmak istiyorsunuz?
            </p>

            {/* Quick Fill */}
            <button
              onClick={() => {
                setMode('quick')
                handleQuickFill()
              }}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:border-amber-400 dark:hover:border-amber-600 transition-all group text-left cursor-pointer"
            >
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-none group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Hızlı Doldur
                  </span>
                  <span className="text-[10px] bg-amber-500 text-white rounded-full px-2 py-0.5 font-bold">
                    ÖNERİLEN
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kurum bilgilerini bilerek formu tek hamlede doldurur. Onaylamanız yeterli.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors flex-none" />
            </button>

            {/* Chat Mode */}
            <button
              onClick={handleChatStart}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-400 dark:hover:border-purple-600 transition-all group text-left cursor-pointer"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center flex-none group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Sohbet Modu
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Asistana ne almak istediğinizi anlatın, o formu adım adım doldursun.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors flex-none" />
            </button>

            {/* Context info */}
            {context.kurumBilgisi?.birimAdi && (
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Kullanılacak Bağlam:
                  </span>{' '}
                  {context.kurumBilgisi.birimAdi}
                  {context.kurumBilgisi.sunulacakMakam &&
                    ` · ${context.kurumBilgisi.sunulacakMakam}`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Quick Fill ── */}
        {mode === 'quick' && (
          <AIFormFillQuickView
            context={context}
            quickLoading={quickLoading}
            quickResult={quickResult}
            quickError={quickError}
            onApplyAndClose={handleApplyAndClose}
            onQuickFill={handleQuickFill}
            onBack={() => {
              setMode('select')
              setQuickResult(null)
              setQuickError('')
            }}
          />
        )}

        {/* ── Chat Mode ── */}
        {mode === 'chat' && (
          <AIFormFillChatView
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            chatPendingApply={chatPendingApply}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendMessage={handleSendMessage}
            onApplyAndClose={handleApplyAndClose}
            chatEndRef={chatEndRef}
            inputRef={inputRef}
            context={context}
          />
        )}
      </div>
    </div>
  )
}
