import React, { RefObject } from 'react'
import { Bot, Loader2, Send, User2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { AIFormContext, AIFilledValues, ChatMessage } from './aiFormFill.types'
import { PreviewPanel } from './AIFormFillPreviewPanel'

interface AIFormFillChatViewProps {
  chatMessages: ChatMessage[]
  chatLoading: boolean
  chatPendingApply: AIFilledValues | null
  chatInput: string
  onChatInputChange: (text: string) => void
  onSendMessage: () => void
  onApplyAndClose: (values: AIFilledValues) => void
  chatEndRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLTextAreaElement | null>
  context: AIFormContext
}

export function AIFormFillChatView({
  chatMessages,
  chatLoading,
  chatPendingApply,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onApplyAndClose,
  chatEndRef,
  inputRef,
  context
}: AIFormFillChatViewProps): React.JSX.Element {
  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-none',
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              )}
            >
              {msg.role === 'assistant' ? (
                <Bot className="w-3.5 h-3.5 text-white" />
              ) : (
                <User2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-tr-sm'
              )}
            >
              {msg.content.split('\n').map((line, li) => (
                <p key={li}>{line || <br />}</p>
              ))}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-none">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            </div>
          </div>
        )}

        {chatPendingApply && (
          <div className="mx-2">
            <PreviewPanel values={chatPendingApply} context={context} onApply={onApplyAndClose} />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex-none border-t border-slate-100 dark:border-slate-800 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
            placeholder="Mesaj yazın... (örn: Fen İşleri kırtasiye alımı için doldur)"
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400 custom-scrollbar resize-none"
            disabled={chatLoading}
          />
          <button
            onClick={onSendMessage}
            disabled={!chatInput.trim() || chatLoading}
            className="px-3.5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            {chatLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
          Asistan formu doldurduğunda &quot;Forma Uygula&quot; butonu görünür
        </p>
      </div>
    </>
  )
}
