import React from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface AiTabProps {
  aiProvider: string
  setAiProvider: (val: string) => void
  aiGeminiApiKey: string
  setAiGeminiApiKey: (val: string) => void
  aiOpenaiApiKey: string
  setAiOpenaiApiKey: (val: string) => void
  aiAnthropicApiKey: string
  setAiAnthropicApiKey: (val: string) => void
  aiTestStatus: 'idle' | 'loading' | 'ok' | 'error'
  setAiTestStatus: (val: 'idle' | 'loading' | 'ok' | 'error') => void
  aiTestMsg: string
  setAiTestMsg: (val: string) => void
  handleTestConnection: () => void
}

export const AiTab: React.FC<AiTabProps> = ({
  aiProvider,
  setAiProvider,
  aiGeminiApiKey,
  setAiGeminiApiKey,
  aiOpenaiApiKey,
  setAiOpenaiApiKey,
  aiAnthropicApiKey,
  setAiAnthropicApiKey,
  aiTestStatus,
  setAiTestStatus,
  setAiTestMsg,
  aiTestMsg,
  handleTestConnection
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-855 dark:text-slate-100">
            Yapay Zeka (AI) Ayarları
          </h2>
          <p className="text-xs text-slate-500">
            Yer tutucular ve metin üretimi için kullanılacak AI sağlayıcısını seçin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Sağlayıcı Seçimi */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Aktif AI Sağlayıcısı
          </label>
          <select
            value={aiProvider}
            onChange={(e) => {
              setAiProvider(e.target.value)
              setAiTestStatus('idle')
              setAiTestMsg('')
            }}
            className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            title="Aktif AI Sağlayıcısı"
          >
            <option value="gemini">Google Gemini (Önerilen)</option>
            <option value="openai">OpenAI (GPT-4o mini)</option>
            <option value="anthropic">Anthropic (Claude Haiku)</option>
          </select>
        </div>

        {/* Gemini */}
        {aiProvider === 'gemini' && (
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400">
              Google Gemini API Anahtarı
            </label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={aiGeminiApiKey}
              onChange={(e) => setAiGeminiApiKey(e.target.value)}
              className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
            <p className="text-xs text-slate-400 mt-1">
              API anahtarını{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  window.electron.shell.openExternal('https://aistudio.google.com/app/apikey')
                }}
              >
                Google AI Studio
              </a>{' '}
              üzerinden ücretsiz edinebilirsiniz. Anahtar yalnızca bu cihazda saklanır.
            </p>
          </div>
        )}

        {/* OpenAI */}
        {aiProvider === 'openai' && (
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400">
              OpenAI API Anahtarı
            </label>
            <Input
              type="password"
              placeholder="sk-..."
              value={aiOpenaiApiKey}
              onChange={(e) => setAiOpenaiApiKey(e.target.value)}
              className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
            <p className="text-xs text-slate-400 mt-1">
              API anahtarını{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  window.electron.shell.openExternal('https://platform.openai.com/api-keys')
                }}
              >
                OpenAI API Keys
              </a>{' '}
              üzerinden edinebilirsiniz. Anahtar yalnızca bu cihazda saklanır.
            </p>
          </div>
        )}

        {/* Anthropic */}
        {aiProvider === 'anthropic' && (
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400">
              Anthropic API Anahtarı
            </label>
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={aiAnthropicApiKey}
              onChange={(e) => setAiAnthropicApiKey(e.target.value)}
              className="bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
            <p className="text-xs text-slate-400 mt-1">
              API anahtarını{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  window.electron.shell.openExternal('https://console.anthropic.com/settings/keys')
                }}
              >
                Anthropic Console
              </a>{' '}
              üzerinden edinebilirsiniz. Anahtar yalnızca bu cihazda saklanır.
            </p>
          </div>
        )}

        {/* Bağlantı Testi */}
        <div className="md:col-span-2 flex items-center gap-3 pt-1">
          <Button
            onClick={handleTestConnection}
            disabled={aiTestStatus === 'loading'}
            className="text-xs py-1.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 gap-1.5"
          >
            {aiTestStatus === 'loading' ? '⏳ Test Ediliyor...' : '⚡ Bağlantıyı Test Et'}
          </Button>
          {aiTestStatus === 'ok' && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {aiTestMsg}
            </span>
          )}
          {aiTestStatus === 'error' && (
            <span className="text-xs font-semibold text-red-500 dark:text-red-400">
              {aiTestMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
