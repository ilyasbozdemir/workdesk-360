/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextAlign } from '@tiptap/extension-text-align'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  FileText,
  Sparkles,
  Tag,
  GitBranch,
  Repeat,
  Plus
} from 'lucide-react'
import { KutuphaneEditorExtensions } from '../../screens/belgelerim/editor/kutuphaneEditorExtensions'

export interface EditorVariable {
  label: string
  var: string
  group?: string
}

interface A4EditorProps {
  content: string
  onChange: (html: string) => void
  readOnly?: boolean
  enableKutuphaneExtensions?: boolean
  availablePlaceholders?: Array<{ key: string; label: string; group?: string }>
  availableConditions?: Array<{ flag: string; label?: string }>
  variables?: EditorVariable[]
}

export function A4Editor({
  content,
  onChange,
  readOnly = false,
  enableKutuphaneExtensions = false,
  availablePlaceholders = [],
  availableConditions = [],
  variables
}: A4EditorProps): React.JSX.Element {
  const [isRawMode, setIsRawMode] = useState(false)
  const [showPhPrompt, setShowPhPrompt] = useState(false)
  const [showCondPrompt, setShowCondPrompt] = useState(false)
  const [showEachPrompt, setShowEachPrompt] = useState(false)
  const [customKey, setCustomKey] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [customFlag, setCustomFlag] = useState('')
  const [customList, setCustomList] = useState('')

  const resolvedVariables = React.useMemo<EditorVariable[]>(() => {
    if (variables && variables.length > 0) {
      return variables
    }
    if (availablePlaceholders && availablePlaceholders.length > 0) {
      return availablePlaceholders.map((p) => ({
        label: p.label,
        var: `{{${p.key}}}`,
        group: p.group || 'Tanımlı Değişkenler'
      }))
    }
    return []
  }, [variables, availablePlaceholders])

  const getInnerAndShell = (html: string): { inner: string; prefix: string; suffix: string } => {
    const bodyMatch = html.match(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i)
    if (bodyMatch) {
      const bodyTag = bodyMatch[1]
      const bodyClose = bodyMatch[3]
      const prefixIndex = html.indexOf(bodyTag) + bodyTag.length
      const suffixIndex = html.lastIndexOf(bodyClose)
      return {
        inner: html.substring(prefixIndex, suffixIndex),
        prefix: html.substring(0, prefixIndex),
        suffix: html.substring(suffixIndex)
      }
    }
    return { inner: html, prefix: '', suffix: '' }
  }

  const [initialShell] = useState(() => getInnerAndShell(content))
  const shellRef = useRef({ prefix: initialShell.prefix, suffix: initialShell.suffix })

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      ...(enableKutuphaneExtensions ? KutuphaneEditorExtensions : [])
    ],
    content: getInnerAndShell(content).inner,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML()
      if (shellRef.current.prefix || shellRef.current.suffix) {
        onChange(shellRef.current.prefix + newHtml + shellRef.current.suffix)
      } else {
        onChange(newHtml)
      }
    }
  })

  // Update content if changed externally (e.g., initial load or mode switch)
  useEffect(() => {
    if (editor && !isRawMode) {
      const { inner, prefix, suffix } = getInnerAndShell(content)
      shellRef.current = { prefix, suffix }
      if (inner !== editor.getHTML()) {
        editor.commands.setContent(inner, { emitUpdate: false } as any)
      }
    }
  }, [content, editor, isRawMode])

  if (!editor) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
      {/* TOOLBAR */}
      {!readOnly && (
        <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 flex flex-wrap gap-1 relative z-20">
          <button
            onClick={() => setIsRawMode(!isRawMode)}
            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
              isRawMode
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                : 'text-slate-600 dark:text-slate-300'
            } font-semibold text-xs flex items-center gap-1 mr-2`}
            title="Ham HTML Kodu"
          >
            <Code className="w-4 h-4" /> HTML
          </button>

          {!isRawMode && (
            <>
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('bold')
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Kalın"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('italic')
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="İtalik"
              >
                <Italic className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('heading', { level: 1 })
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Başlık 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('heading', { level: 2 })
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Başlık 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('heading', { level: 3 })
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Başlık 3"
              >
                <Heading3 className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('bulletList')
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Sırasız Liste"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive('orderedList')
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Sıralı Liste"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive({ textAlign: 'left' })
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Sola Hizala"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive({ textAlign: 'center' })
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Ortala"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.isActive({ textAlign: 'right' })
                    ? 'bg-slate-200 dark:bg-slate-700 text-blue-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Sağa Hizala"
              >
                <AlignRight className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

              <button
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300`}
                title="Tablo Ekle"
              >
                <TableIcon className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

              {/* WORD IMPORT */}
              <button
                onClick={async () => {
                  try {
                    if (window.electron?.ipcRenderer) {
                      const res = await window.electron.ipcRenderer.invoke('document:import-docx')
                      if (res.success && res.html) {
                        editor.commands.setContent(res.html)
                      }
                    }
                  } catch (err) {
                    console.error('Word import error:', err)
                  }
                }}
                className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center gap-1"
                title="Word (.docx) İçe Aktar"
              >
                <FileText className="w-4 h-4" /> Word Yükle
              </button>

              {/* DİNAMİK DEĞİŞKEN EKLE DROPDOWN */}
              {resolvedVariables.length > 0 && (
                <div className="relative group">
                  <button
                    className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60"
                    title="Dinamik Şablon Değişkeni Ekle"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Değişken Ekle
                  </button>
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1.5 min-w-55 max-h-72 overflow-y-auto z-50">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                      Şablon Değişkenleri
                    </div>
                    {resolvedVariables.map((item) => (
                      <button
                        key={item.var}
                        onClick={() => editor.chain().focus().insertContent(` ${item.var} `).run()}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs text-slate-700 dark:text-slate-200 flex justify-between items-center transition-colors gap-2"
                      >
                        <span className="truncate">{item.label}</span>
                        <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                          {item.var}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* KÜTÜPHANE ÖZEL ARAÇLARI (Yer Tutucu Chip, Koşul Bloğu, Liste Döngüsü) */}
              {enableKutuphaneExtensions && (
                <>
                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

                  {/* Yer Tutucu Chip Ekle */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowPhPrompt(!showPhPrompt)
                        setShowCondPrompt(false)
                        setShowEachPrompt(false)
                      }}
                      className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-800/60"
                      title="Yer Tutucu Ekle (Kanonik HTML chip)"
                    >
                      <Tag className="w-3.5 h-3.5" /> Yer Tutucu
                    </button>

                    {showPhPrompt && (
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl p-3 min-w-[260px] z-50">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                          Yer Tutucu Ekle
                        </div>
                        {availablePlaceholders.length > 0 && (
                          <div className="max-h-32 overflow-y-auto mb-2 space-y-1">
                            {availablePlaceholders.map((p) => (
                              <button
                                key={p.key}
                                onClick={() => {
                                  ;(editor.chain().focus() as any)
                                    .insertPlaceholder({ key: p.key, label: p.label })
                                    .run()
                                  setShowPhPrompt(false)
                                }}
                                className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded flex justify-between items-center text-slate-700 dark:text-slate-200"
                              >
                                <span>{p.label}</span>
                                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                  {p.key}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <input
                            type="text"
                            placeholder="Yeni Anahtar (örn: sozlesmeTarihi)"
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            placeholder="Etiket (örn: Sözleşme Tarihi)"
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100"
                          />
                          <button
                            onClick={() => {
                              if (!customKey.trim()) return
                              ;(editor.chain().focus() as any)
                                .insertPlaceholder({
                                  key: customKey.trim(),
                                  label: customLabel.trim() || customKey.trim()
                                })
                                .run()
                              setCustomKey('')
                              setCustomLabel('')
                              setShowPhPrompt(false)
                            }}
                            className="w-full py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Ekle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Koşul Bloğu Ekle */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowCondPrompt(!showCondPrompt)
                        setShowPhPrompt(false)
                        setShowEachPrompt(false)
                      }}
                      className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1 border border-amber-200 dark:border-amber-800/60"
                      title="Koşullu Blok Ekle"
                    >
                      <GitBranch className="w-3.5 h-3.5" /> Koşullu Blok
                    </button>

                    {showCondPrompt && (
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl p-3 min-w-[240px] z-50">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                          Koşullu Blok Ekle
                        </div>
                        {availableConditions.length > 0 && (
                          <div className="max-h-32 overflow-y-auto mb-2 space-y-1">
                            {availableConditions.map((c) => (
                              <button
                                key={c.flag}
                                onClick={() => {
                                  ;(editor.chain().focus() as any)
                                    .insertConditionBlock(c.flag)
                                    .run()
                                  setShowCondPrompt(false)
                                }}
                                className="w-full text-left px-2 py-1 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded flex justify-between items-center text-slate-700 dark:text-slate-200"
                              >
                                <span>{c.label || c.flag}</span>
                                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                                  {c.flag}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <input
                            type="text"
                            placeholder="Koşul Bayrağı (örn: kdvDahilMi)"
                            value={customFlag}
                            onChange={(e) => setCustomFlag(e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100"
                          />
                          <button
                            onClick={() => {
                              if (!customFlag.trim()) return
                              ;(editor.chain().focus() as any)
                                .insertConditionBlock(customFlag.trim())
                                .run()
                              setCustomFlag('')
                              setShowCondPrompt(false)
                            }}
                            className="w-full py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Blok Ekle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Liste Döngüsü Ekle */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowEachPrompt(!showEachPrompt)
                        setShowPhPrompt(false)
                        setShowCondPrompt(false)
                      }}
                      className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60"
                      title="Liste Tekrarı (data-each)"
                    >
                      <Repeat className="w-3.5 h-3.5" /> Liste Bloğu
                    </button>

                    {showEachPrompt && (
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl p-3 min-w-[240px] z-50">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                          Liste Döngüsü Ekle
                        </div>
                        <input
                          type="text"
                          placeholder="Liste Adı (örn: uyeler, kalemler)"
                          value={customList}
                          onChange={(e) => setCustomList(e.target.value)}
                          className="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 mb-2"
                        />
                        <button
                          onClick={() => {
                            if (!customList.trim()) return
                            ;(editor.chain().focus() as any)
                              .insertEachBlock(customList.trim())
                              .run()
                            setCustomList('')
                            setShowEachPrompt(false)
                          }}
                          className="w-full py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Döngü Ekle
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* EDITOR CANVAS */}
      <div
        className={`flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200 dark:bg-slate-800 custom-scrollbar flex justify-center w-full relative z-10 ${
          isRawMode ? 'p-0 md:p-0 bg-transparent dark:bg-transparent' : ''
        }`}
      >
        {isRawMode ? (
          <textarea
            className="w-full h-full min-h-[500px] p-4 bg-slate-900 text-slate-300 font-mono text-sm resize-none outline-none border-none"
            value={content}
            onChange={(e) => {
              onChange(e.target.value)
              if (editor) editor.commands.setContent(e.target.value)
            }}
            spellCheck={false}
          />
        ) : (
          <div className="w-[210mm] min-h-[297mm] max-w-full bg-white text-black p-[20mm] shadow-lg border border-slate-300 dark:border-slate-700 print:shadow-none print:border-none editor-content">
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .editor-content .ProseMirror { min-height: 100%; outline: none; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
              .editor-content .ProseMirror p { margin-bottom: 1em; }
              .editor-content .ProseMirror h1 { font-size: 16pt; font-weight: bold; margin-bottom: 0.5em; }
              .editor-content .ProseMirror h2 { font-size: 14pt; font-weight: bold; margin-bottom: 0.5em; }
              .editor-content .ProseMirror h3 { font-size: 12pt; font-weight: bold; margin-bottom: 0.5em; }
              .editor-content .ProseMirror ul { list-style-type: disc; padding-left: 20px; margin-bottom: 1em; }
              .editor-content .ProseMirror ol { list-style-type: decimal; padding-left: 20px; margin-bottom: 1em; }
              .editor-content .ProseMirror table { border-collapse: collapse; width: 100%; margin-bottom: 1em; table-layout: fixed; }
              .editor-content .ProseMirror td, .editor-content .ProseMirror th { border: 1px solid #cbd5e1; padding: 8px; min-width: 1em; }
              .editor-content .ProseMirror th { font-weight: bold; background-color: #f1f5f9; text-align: left; }
              .editor-content .ProseMirror .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200, 200, 255, 0.4); pointer-events: none; }
              .editor-content .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #adf; pointer-events: none; }
              .editor-content .kutuphane-ph-chip { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; font-weight: 600; background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; user-select: all; margin: 0 2px; }
              .editor-content .kutuphane-cond-block { margin: 10px 0; padding: 8px 12px; border-left: 4px solid #f59e0b; background-color: rgba(254, 243, 199, 0.4); border-radius: 0 6px 6px 0; }
              .editor-content .kutuphane-each-block { margin: 10px 0; padding: 8px 12px; border-left: 4px solid #10b981; background-color: rgba(209, 250, 229, 0.4); border-radius: 0 6px 6px 0; }
            `
              }}
            />
            <EditorContent editor={editor} className="h-full w-full outline-none" />
          </div>
        )}
      </div>
    </div>
  )
}
