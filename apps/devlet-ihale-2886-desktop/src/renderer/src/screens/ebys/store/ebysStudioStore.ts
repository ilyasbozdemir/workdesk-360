import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EbysCategory, EbysTemplate } from '../ebys.types'

export interface EbysDraftItem {
  id: string
  title: string
  html: string
  sourceTemplateId?: string
  updatedAt: string
}

export interface EbysCustomTemplate {
  id: string
  name: string
  category: EbysCategory
  categoryLabel: string
  description: string
  html: string
  createdAt: string
  tags?: string[]
}

interface EbysStudioState {
  /** Aktif üzerinde çalışılan taslak */
  currentHtml: string
  currentTitle: string
  currentDraftId: string | null

  /** Kaydedilen çalışma/taslak listesi */
  drafts: EbysDraftItem[]

  /** Kullanıcının oluşturduğu özel şablonlar */
  customTemplates: EbysCustomTemplate[]

  /** State güncelleyiciler */
  setCurrentHtml: (html: string) => void
  setCurrentTitle: (title: string) => void

  /** Çalışmayı Taslak Olarak Kaydet */
  saveCurrentDraft: (title?: string) => string

  /** Taslak Yükle */
  loadDraft: (id: string) => boolean

  /** Taslak Sil */
  deleteDraft: (id: string) => void

  /** Şablon Olarak Kaydet (Süreçlerde ve yazışmalarda tekrar kullanmak için) */
  saveAsCustomTemplate: (template: {
    name: string
    category: EbysCategory
    categoryLabel?: string
    description: string
    tags?: string[]
  }) => string

  /** Özel Şablon Sil */
  deleteCustomTemplate: (id: string) => void

  /** Özel Şablonları EbysTemplate formatında dön */
  getCustomTemplatesAsEbys: () => EbysTemplate[]
}

const DEFAULT_BLANK_EBYS_HTML = `<div class="ebys-a4-page" style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.45; color: #000; padding: 25px;">
  <div style="text-align: center; font-weight: bold; margin-bottom: 25px;">
    <div style="font-size: 12pt; letter-spacing: 1px;">T.C.</div>
    <div style="font-size: 12pt; text-transform: uppercase; margin-top: 4px;">{{kurumAdi}}</div>
    <div style="font-size: 11pt; font-weight: normal; margin-top: 3px;">{{birimAdi}}</div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
    <tr>
      <td style="text-align: left; vertical-align: top; width: 65%;"><strong>Sayı :</strong> {{sayi}}</td>
      <td style="text-align: right; vertical-align: top; width: 35%;"><strong>Tarih:</strong> {{tarih}}</td>
    </tr>
    <tr>
      <td style="text-align: left; vertical-align: top;" colspan="2"><strong>Konu:</strong> {{konu}}</td>
    </tr>
  </table>

  <div style="text-align: center; font-weight: bold; margin: 30px 0 20px 0; font-size: 12pt; text-transform: uppercase;">
    {{muhatap}}
  </div>

  <p style="text-indent: 10mm; text-align: justify; margin-bottom: 14px;">
    İdaremiz sorumluluğunda yürütülmekte olan iş ve işlemler ile satın alma / ihale süreçleri kapsamında hazırlanan resmi yazışma metni aşağıda yer almaktadır.
  </p>

  <p style="text-indent: 10mm; text-align: justify; margin-bottom: 14px;">
    Konuya ilişkin bilgi, onay veya değerlendirmelerinizi rica / arz ederim.
  </p>

  <p style="text-indent: 10mm; text-align: justify; margin-top: 20px; margin-bottom: 30px;">
    {{sonucParagrafi}}
  </p>

  <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 35px; margin-bottom: 25px;">
    <div style="width: 220px; text-align: center;">
      <div style="font-weight: bold; font-size: 11.5pt; text-transform: uppercase;">{{imzaAdi}}</div>
      <div style="font-size: 11pt; margin-top: 4px;">{{imzaUnvani}}</div>
      <div style="font-size: 8pt; font-style: italic; color: #444; margin-top: 6px; border-top: 1px dashed #888; padding-top: 3px;">
        5070 Sayılı Kanun Uyarınca Güvenli E-İmza ile İmzalanmıştır.
      </div>
    </div>
  </div>
</div>`

export const useEbysStudioStore = create<EbysStudioState>()(
  persist(
    (set, get) => ({
      currentHtml: DEFAULT_BLANK_EBYS_HTML,
      currentTitle: 'Yeni Resmî Yazı Taslağı',
      currentDraftId: null,
      drafts: [],
      customTemplates: [],

      setCurrentHtml: (html: string) => set({ currentHtml: html }),
      setCurrentTitle: (title: string) => set({ currentTitle: title }),

      saveCurrentDraft: (customTitle?: string) => {
        const title = customTitle || get().currentTitle || 'Yeni Resmî Yazı Taslağı'
        const id = get().currentDraftId || `draft_${Date.now()}`
        const html = get().currentHtml
        const now = new Date().toLocaleString('tr-TR')

        const existingIdx = get().drafts.findIndex((d) => d.id === id)
        let nextDrafts: EbysDraftItem[]

        if (existingIdx >= 0) {
          nextDrafts = [...get().drafts]
          nextDrafts[existingIdx] = {
            id,
            title,
            html,
            updatedAt: now
          }
        } else {
          nextDrafts = [
            {
              id,
              title,
              html,
              updatedAt: now
            },
            ...get().drafts
          ]
        }

        set({
          drafts: nextDrafts,
          currentDraftId: id,
          currentTitle: title
        })

        return id
      },

      loadDraft: (id: string) => {
        const draft = get().drafts.find((d) => d.id === id)
        if (!draft) return false

        set({
          currentHtml: draft.html,
          currentTitle: draft.title,
          currentDraftId: draft.id
        })
        return true
      },

      deleteDraft: (id: string) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          currentDraftId: state.currentDraftId === id ? null : state.currentDraftId
        }))
      },

      saveAsCustomTemplate: ({ name, category, categoryLabel, description, tags }) => {
        const id = `custom_tpl_${Date.now()}`
        const newTemplate: EbysCustomTemplate = {
          id,
          name: name.trim() || 'Özel EBYS Şablonu',
          category: category || 'ust_yazi',
          categoryLabel: categoryLabel || 'Özel Şablon',
          description:
            description.trim() || 'Kullanıcı tarafından oluşturulan özel resmî yazı şablonu.',
          html: get().currentHtml,
          createdAt: new Date().toLocaleDateString('tr-TR'),
          tags: tags || ['Özel Şablon', 'TipTap']
        }

        set((state) => ({
          customTemplates: [newTemplate, ...state.customTemplates]
        }))

        return id
      },

      deleteCustomTemplate: (id: string) => {
        set((state) => ({
          customTemplates: state.customTemplates.filter((t) => t.id !== id)
        }))
      },

      getCustomTemplatesAsEbys: (): EbysTemplate[] => {
        return get().customTemplates.map((ct) => ({
          id: ct.id,
          name: ct.name,
          category: ct.category,
          categoryLabel: ct.categoryLabel || 'Özel Şablon',
          description: ct.description,
          sourceUrl: 'Kullanıcı Özel Şablon Deposu',
          sourceType: 'Belediye / Bakanlık Şablonu',
          format: 'EBYS Şablonu',
          license: 'Kurum İçi Özel Şablon',
          complianceNotes: [
            'Kullanıcı tarafından TipTap editöründe oluşturulmuş dinamik EBYS şablonu.'
          ],
          defaultVariables: {
            kurumAdi: 'T.C. ANKARA BÜYÜKŞEHİR BELEDİYESİ',
            birimAdi: 'Destek Hizmetleri Dairesi Başkanlığı',
            sayi: 'E-98234211-934.01.02-88412',
            tarih: new Date().toLocaleDateString('tr-TR'),
            konu: 'Resmi Yazışma ve Süreç Bildirimi',
            muhatap: 'İLGİLİ BİRİM AMİRLİĞİNE',
            metin:
              'İdaremiz sorumluluğunda yürütülmekte olan doğrudan temin ve kamu ihale süreçleri çerçevesinde gereği arz/rica olunur.',
            sonucParagrafi: 'Bilgilerinizi ve gereğini arz/rica ederim.',
            imzaAdi: 'Hasan YILMAZ',
            imzaUnvani: 'Daire Başkanı'
          },
          generateHtml: (vars) => {
            let rendered = ct.html
            if (vars) {
              rendered = rendered
                .replaceAll('{{kurumAdi}}', vars.kurumAdi || '')
                .replaceAll('{{birimAdi}}', vars.birimAdi || '')
                .replaceAll('{{sayi}}', vars.sayi || '')
                .replaceAll('{{tarih}}', vars.tarih || '')
                .replaceAll('{{konu}}', vars.konu || '')
                .replaceAll('{{muhatap}}', vars.muhatap || '')
                .replaceAll('{{sonucParagrafi}}', vars.sonucParagrafi || '')
                .replaceAll('{{imzaAdi}}', vars.imzaAdi || '')
                .replaceAll('{{imzaUnvani}}', vars.imzaUnvani || '')
            }
            return rendered
          },
          generateCss: () => `/* Özel Şablon Standart EBYS CSS */`
        }))
      }
    }),
    {
      name: 'temin360_ebys_studio_store'
    }
  )
)
