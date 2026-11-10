import { describe, it, expect } from 'vitest'
import {
  TEMPLATE_REGISTRY,
  defineTemplate,
  resolveTemplateWorkflow,
  getFromProfileTemplates,
  getTemplatesByExplicitState
} from '../registry'
import { WORKFLOW_PROFILES, getWorkflowProfile } from '../constants/workflowProfiles'
import { TANIM_Roller } from '../../../database/src/tables/TANIM_Roller'

describe('Workflow Profilleri ve Kayıt Defteri Entegrasyon Testleri', () => {
  // Geçerli TANIM_Roller kod kümesi
  const validRolKodlari = new Set(TANIM_Roller.initialData.map((r) => r.rol_kodu))

  it('1. Her şablonun çözümlenmiş bir workflow nesnesi bulunmalıdır', () => {
    expect(TEMPLATE_REGISTRY.length).toBeGreaterThan(0)

    TEMPLATE_REGISTRY.forEach((template) => {
      const resolved = resolveTemplateWorkflow(template.id)
      expect(resolved, `Template "${template.id}" çözümlenmiş bir workflow'a sahip olmalı`).toBeDefined()
      expect(resolved?.explicitState).toBeDefined()
    })
  })

  it('2. Tüm signatures[].role değerleri TANIM_Roller tablosundaki rol kodlarıyla eşleşmelidir', () => {
    TEMPLATE_REGISTRY.forEach((template) => {
      const resolved = resolveTemplateWorkflow(template.id)
      if (resolved?.signatures) {
        resolved.signatures.forEach((sig) => {
          expect(
            validRolKodlari.has(sig.role),
            `Template "${template.id}" imzasındaki rol "${sig.role}" TANIM_Roller tablosunda tanımlı olmalı`
          ).toBe(true)
        })
      }
    })
  })

  it('3. Kendi workflow tanımı olan 3 kaydın çıktısı birebir korunmalıdır (snapshot/derin eşitlik)', () => {
    // 1. harcama-talimati
    const harcama = resolveTemplateWorkflow('harcama-talimati')
    expect(harcama).toEqual({
      routing: {
        mode: 'role',
        targetRole: 'harcama_yetkilisi',
        usesDynamicInstitutionalHeading: true,
        fallbackHeading: 'HARCAMA YETKİLİLİĞİNE'
      },
      signatures: [
        { role: 'gerceklestirme_gorevlisi', slotType: 'checked_by', requirementSource: 'statutory' },
        { role: 'harcama_yetkilisi', slotType: 'approved_by', requirementSource: 'statutory' }
      ],
      approvalRole: 'harcama_yetkilisi',
      explicitState: 'explicit_defined'
    })

    // 2. komisyon-gorevlendirme-onayi
    const komisyonOnay = resolveTemplateWorkflow('komisyon-gorevlendirme-onayi')
    expect(komisyonOnay).toEqual({
      routing: {
        mode: 'role',
        targetRole: 'harcama_yetkilisi',
        usesDynamicInstitutionalHeading: true,
        fallbackHeading: 'HARCAMA YETKİLİLİĞİNE'
      },
      signatures: [
        { role: 'harcama_yetkilisi', slotType: 'approved_by', requirementSource: 'administrative' }
      ],
      approvalRole: 'harcama_yetkilisi',
      explicitState: 'explicit_defined'
    })

    // 3. komisyon-gorevlendirme-onayi-eki
    const komisyonOnayEki = resolveTemplateWorkflow('komisyon-gorevlendirme-onayi-eki')
    expect(komisyonOnayEki).toEqual({
      routing: { mode: 'none' },
      signatures: [
        { role: 'komisyon_baskani', slotType: 'president', requirementSource: 'administrative' },
        { role: 'komisyon_uyesi', slotType: 'member', requirementSource: 'administrative' }
      ],
      explicitState: 'explicit_defined'
    })
  })

  it('4. inheritsFrom döngüsel bağımlılık durumunda hata fırlatmalı ve hedef şablonu çözebilmelidir', () => {
    // Başarılı inheritsFrom
    const onayEkiWorkflow = resolveTemplateWorkflow('luzum-muzekkeresi-onay-eki')
    expect(onayEkiWorkflow).toBeDefined()
    expect(onayEkiWorkflow?.explicitState).toBe('from_profile')
    expect(onayEkiWorkflow?.signatures?.length).toBeGreaterThan(0)

    // Yapay döngüsel bağımlılık testi
    const cyclicRegistry = [
      defineTemplate({
        id: 'sablon-a',
        name: 'A',
        title: 'A',
        category: 'test',
        inheritsFrom: 'sablon-b'
      }),
      defineTemplate({
        id: 'sablon-b',
        name: 'B',
        title: 'B',
        category: 'test',
        inheritsFrom: 'sablon-a'
      })
    ]

    expect(() => {
      resolveTemplateWorkflow('sablon-a', cyclicRegistry)
    }).toThrow(/Döngüsel şablon bağımlılığı tespit edildi/)

    // Bulunamayan ana şablon testi
    const brokenRegistry = [
      defineTemplate({
        id: 'sablon-x',
        name: 'X',
        title: 'X',
        category: 'test',
        inheritsFrom: 'olmayan-sablon'
      })
    ]

    expect(() => {
      resolveTemplateWorkflow('sablon-x', brokenRegistry)
    }).toThrow(/Miras alınacak şablon bulunamadı/)
  })

  it('5. Öncelik sırası: Kendi workflow > workflowOverride > workflowProfile doğru çalışmalıdır', () => {
    // Senaryo A: Kendi workflow'u olan şablon (override ve profile belirtilse dahi kendi workflow'u kazanır)
    const tExplicit = defineTemplate({
      id: 'test-explicit',
      name: 'Explicit',
      title: 'Explicit',
      category: 'test',
      workflowProfile: 'ic_form',
      workflow: {
        routing: { mode: 'none' },
        signatures: [{ role: 'muhasebe', slotType: 'prepared_by', requirementSource: 'statutory' }],
        explicitState: 'explicit_defined'
      }
    })
    expect(tExplicit.workflow?.signatures?.[0].role).toBe('muhasebe')
    expect(tExplicit.workflow?.explicitState).toBe('explicit_defined')

    // Senaryo B: Profil + workflowOverride birleştirmesi
    const tOverridden = defineTemplate({
      id: 'test-override',
      name: 'Override',
      title: 'Override',
      category: 'test',
      workflowProfile: 'olur_onay',
      workflowOverride: {
        approvalRole: 'ihale_yetkilisi',
        routing: { mode: 'role', targetRole: 'ihale_yetkilisi' }
      }
    })
    expect(tOverridden.workflow?.explicitState).toBe('from_profile')
    expect(tOverridden.workflow?.approvalRole).toBe('ihale_yetkilisi')
    expect(tOverridden.workflow?.routing?.targetRole).toBe('ihale_yetkilisi')
    // Temel profilin imzaları korunmalı
    expect(tOverridden.workflow?.signatures?.length).toBe(3)
  })

  it('6. getFromProfileTemplates yardımcı fonksiyonu profilden türetilmiş kayıtları döndürmelidir', () => {
    const fromProfileList = getFromProfileTemplates()
    expect(fromProfileList.length).toBeGreaterThan(0)

    // 3 özel kayıt fromProfileList içinde yer almamalıdır
    const explicitIds = ['harcama-talimati', 'komisyon-gorevlendirme-onayi', 'komisyon-gorevlendirme-onayi-eki']
    explicitIds.forEach((id) => {
      const match = fromProfileList.find((t) => t.id === id)
      expect(match, `"${id}" profilden değil, doğrudan tanımlı olmalıdır`).toBeUndefined()
    })

    const explicitList = getTemplatesByExplicitState('explicit_defined')
    expect(explicitList.length).toBe(3)
  })
})
