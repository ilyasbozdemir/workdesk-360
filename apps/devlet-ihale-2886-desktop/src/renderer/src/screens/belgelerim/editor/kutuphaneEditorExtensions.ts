/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node, mergeAttributes } from '@tiptap/react'

export interface InsertPlaceholderAttrs {
  key: string
  label?: string
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    placeholderNode: {
      insertPlaceholder: (attrs: InsertPlaceholderAttrs) => ReturnType
    }
    conditionBlockNode: {
      insertConditionBlock: (flag: string) => ReturnType
    }
    eachBlockNode: {
      insertEachBlock: (list: string) => ReturnType
    }
  }
}

/**
 * 1. Yer Tutucu Chip'i (<span data-ph="...">)
 * İki yönlü bağlama: DOM'da <span data-ph="anahtar" data-label="Etiket"> metnini taşır.
 */
export const PlaceholderNode = Node.create({
  name: 'placeholderNode',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-ph') || '',
        renderHTML: (attrs) => ({ 'data-ph': attrs.key })
      },
      label: {
        default: '',
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('data-label') || el.textContent?.replace(/^\{\{|\}\}$/g, '') || '',
        renderHTML: (attrs) => ({ 'data-label': attrs.label || attrs.key })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-ph]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const key = HTMLAttributes['data-ph'] || ''
    const label = HTMLAttributes['data-label'] || key
    return [
      'span',
      mergeAttributes(
        {
          class:
            'kutuphane-ph-chip inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 select-all mx-0.5 align-baseline cursor-pointer',
          contenteditable: 'false'
        },
        HTMLAttributes
      ),
      `{{${label}}}`
    ]
  },

  addCommands() {
    return {
      insertPlaceholder:
        (attrs: InsertPlaceholderAttrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                key: attrs.key,
                label: attrs.label || attrs.key
              }
            })
            .run()
        }
    }
  }
})

/**
 * 2. Koşullu Blok Kutusu (<div data-cond="bayrak">...</div>)
 * İç içe desteklenir (content: 'block+')
 */
export const ConditionBlockNode = Node.create({
  name: 'conditionBlockNode',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      flag: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-cond') || '',
        renderHTML: (attrs) => ({ 'data-cond': attrs.flag })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-cond]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const flag = HTMLAttributes['data-cond'] || ''
    return [
      'div',
      mergeAttributes(
        {
          class:
            'kutuphane-cond-block my-2.5 p-2.5 border-l-4 border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 rounded-r-lg shadow-2xs'
        },
        HTMLAttributes
      ),
      [
        'div',
        {
          class:
            'text-[11px] font-bold text-amber-800 dark:text-amber-400 select-none mb-1.5 flex items-center gap-1.5',
          contenteditable: 'false'
        },
        `⚙️ KOŞULLU BLOK: [${flag}]`
      ],
      ['div', { class: 'kutuphane-cond-content' }, 0]
    ]
  },

  addCommands() {
    return {
      insertConditionBlock:
        (flag: string) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { flag },
              content: [{ type: 'paragraph' }]
            })
            .run()
        }
    }
  }
})

/**
 * 3. Liste Bloğu (<div data-each="liste">...</div>)
 * Satır tekrarı veya döngüler için
 */
export const EachBlockNode = Node.create({
  name: 'eachBlockNode',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      list: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-each') || '',
        renderHTML: (attrs) => ({ 'data-each': attrs.list })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-each]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const list = HTMLAttributes['data-each'] || ''
    return [
      'div',
      mergeAttributes(
        {
          class:
            'kutuphane-each-block my-2.5 p-2.5 border-l-4 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-r-lg shadow-2xs'
        },
        HTMLAttributes
      ),
      [
        'div',
        {
          class:
            'text-[11px] font-bold text-emerald-800 dark:text-emerald-400 select-none mb-1.5 flex items-center gap-1.5',
          contenteditable: 'false'
        },
        `🔁 LİSTE DÖNGÜSÜ: [${list}]`
      ],
      ['div', { class: 'kutuphane-each-content' }, 0]
    ]
  },

  addCommands() {
    return {
      insertEachBlock:
        (list: string) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { list },
              content: [{ type: 'paragraph' }]
            })
            .run()
        }
    }
  }
})

export const KutuphaneEditorExtensions = [PlaceholderNode, ConditionBlockNode, EachBlockNode]
