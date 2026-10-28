/**
 * FlowDesk — Genel Süreç, Algoritma ve Belge Yürütme Motoru (Process, Rule & Document Engine)
 *
 * Kurumdaki tüm çok aşamalı ve algoritmik iş akışlarını (3194 İmar Kanunu Md. 32/42 Kaçak Yapı
 * Tespit/Ceza/Yıkım Süreci, 2886 Devlet İhale Süreci, Kamulaştırma, Personel İzin/Görev vb.)
 * veritabanına sabit şema gömmeden, JSON/Şablon tanımları ve kural algoritmaları üzerinden
 * yürüten çekirdek motor.
 */

import type {
  FlowDefinition,
  FlowInstance,
  FlowStep,
  FlowStepExecution,
  FlowHistory,
  FormSchema,
  DocumentTemplateDefinition,
  DocumentInstance,
  FlowdeskModuleManifest,
  FlowConditionRule
} from './flowdesk.js'

/**
 * Kanuni süre hesaplayıcı (Takvim günü veya hafta sonu hariç iş günü)
 */
export function calculateStatutoryDeadline(
  baseDateIso: string,
  durationDays: number,
  dayType: 'calendar' | 'business'
): string {
  const baseDate = new Date(baseDateIso)
  const start = isNaN(baseDate.getTime()) ? new Date() : new Date(baseDate.getTime())

  if (dayType === 'calendar') {
    start.setUTCDate(start.getUTCDate() + durationDays)
    return start.toISOString().split('T')[0]
  }

  let added = 0
  while (added < durationDays) {
    start.setUTCDate(start.getUTCDate() + 1)
    const dayOfWeek = start.getUTCDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++
    }
  }
  return start.toISOString().split('T')[0]
}

/**
 * Algoritmik koşul değerlendirici
 */
export function evaluateConditionRule(
  rule: FlowConditionRule,
  data: Record<string, unknown>
): boolean {
  const actual = data[rule.field]
  const expected = rule.value

  switch (rule.operator) {
    case 'eq':
      return actual === expected
    case 'neq':
      return actual !== expected
    case 'gt':
      return Number(actual) > Number(expected)
    case 'gte':
      return Number(actual) >= Number(expected)
    case 'lt':
      return Number(actual) < Number(expected)
    case 'lte':
      return Number(actual) <= Number(expected)
    case 'in':
      return Array.isArray(expected) && expected.includes(actual)
    default:
      return false
  }
}

export class FlowEngine {
  private instances: Map<string, FlowInstance> = new Map()
  private definitions: Map<string, FlowDefinition> = new Map()
  private templates: Map<string, DocumentTemplateDefinition> = new Map()
  private formSchemas: Map<string, FormSchema> = new Map()
  private documentInstances: Map<string, DocumentInstance[]> = new Map()
  private modules: Map<string, FlowdeskModuleManifest> = new Map()

  /**
   * Çok aşamalı bir mevzuat/süreç modülünü (şablonlar + algoritmalar + formlar + evraklar)
   * tek seferde motora yükler.
   */
  registerModule(manifest: FlowdeskModuleManifest): void {
    this.modules.set(manifest.id, { ...manifest, isInstalled: true, isEnabled: true })
    for (const schema of manifest.formSchemas || []) {
      this.registerFormSchema(schema)
    }
    for (const tpl of manifest.documentTemplates || []) {
      this.registerTemplate(tpl)
    }
    for (const flow of manifest.flows || []) {
      this.registerFlowDefinition(flow)
    }
  }

  /**
   * Yüklü mevzuat/süreç modüllerini listeler
   */
  getRegisteredModules(): FlowdeskModuleManifest[] {
    return Array.from(this.modules.values())
  }

  /**
   * Süreç tanımını motora kaydeder
   */
  registerFlowDefinition(definition: FlowDefinition): void {
    this.definitions.set(definition.id, definition)
  }

  /**
   * Belge şablonunu kaydeder
   */
  registerTemplate(template: DocumentTemplateDefinition): void {
    this.templates.set(template.id, template)
  }

  /**
   * Form şemasını kaydeder
   */
  registerFormSchema(schema: FormSchema): void {
    this.formSchemas.set(schema.id, schema)
  }

  /**
   * Yeni bir süreç başlatır (Örn: 3194 Kaçak Yapı Takibi, 2886 İhalesi, İzin Talebi vb.)
   */
  startProcess(params: {
    definitionId: string
    title: string
    initiatorId: string
    initiatorName: string
    initialData?: Record<string, unknown>
  }): FlowInstance {
    const definition = this.definitions.get(params.definitionId)
    if (!definition) {
      throw new Error(`Süreç tanımı bulunamadı: ${params.definitionId}`)
    }

    if (definition.status !== 'published') {
      throw new Error(
        `Sadece 'published' durumundaki süreç tanımları başlatılabilir. Mevcut durum: ${definition.status}`
      )
    }

    const firstGroup = definition.groups.slice().sort((a, b) => a.order - b.order)[0]
    const firstStep = firstGroup?.steps.slice().sort((a, b) => a.order - b.order)[0]

    const instanceId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    const stepExecutions: Record<string, FlowStepExecution> = {}
    for (const group of definition.groups) {
      for (const step of group.steps) {
        stepExecutions[step.id] = {
          stepId: step.id,
          status: step.id === firstStep?.id ? 'in_progress' : 'pending',
          startedAt: step.id === firstStep?.id ? now : undefined,
          data: step.id === firstStep?.id ? params.initialData : undefined
        }
      }
    }

    const instance: FlowInstance = {
      id: instanceId,
      flowDefinitionId: definition.id,
      flowDefinitionVersion: definition.version,
      title: params.title,
      status: 'active',
      currentStepId: firstStep?.id,
      createdAt: now,
      updatedAt: now,
      createdBy: {
        userId: params.initiatorId,
        userName: params.initiatorName
      },
      stepExecutions,
      history: []
    }

    this.instances.set(instanceId, instance)
    this.documentInstances.set(instanceId, [])

    this.logHistory(instance, {
      action: 'process_started',
      stepId: firstStep?.id,
      userId: params.initiatorId,
      userName: params.initiatorName,
      details: {
        title: params.title,
        definitionId: definition.id,
        initialStepId: firstStep?.id
      }
    })

    return instance
  }

  /**
   * Sürecin mevcut durumunu getirir
   */
  getInstance(instanceId: string): FlowInstance | undefined {
    return this.instances.get(instanceId)
  }

  /**
   * Süreçteki toplanan tüm form ve algoritma verilerini birleştirir
   */
  getAggregatedData(instance: FlowInstance): Record<string, unknown> {
    const aggregated: Record<string, unknown> = {}
    for (const exec of Object.values(instance.stepExecutions)) {
      if (exec.data) {
        Object.assign(aggregated, exec.data)
      }
    }
    return aggregated
  }

  /**
   * Adım üzerindeki kanuni süre (`deadlineRule`) ve algoritmik hesaplama (`computedFields`)
   * kurallarını çalıştırarak üretilen türetilmiş verileri döner.
   */
  public evaluateStepAlgorithms(
    step: FlowStep,
    mergedData: Record<string, unknown>,
    nowIso: string
  ): Record<string, unknown> {
    const computed: Record<string, unknown> = {}

    if (step.config.deadlineRule) {
      const rule = step.config.deadlineRule
      const rawBase =
        rule.sourceDateField && mergedData[rule.sourceDateField]
          ? String(mergedData[rule.sourceDateField])
          : nowIso
      computed[rule.targetDateField] = calculateStatutoryDeadline(
        rawBase,
        rule.durationDays,
        rule.dayType
      )
      computed[`${rule.targetDateField}_aciklama`] = rule.description
    }

    if (step.config.computedFields && step.config.computedFields.length > 0) {
      const workingData = { ...mergedData, ...computed }
      for (const rule of step.config.computedFields) {
        if (rule.formula === 'percentage' && rule.sourceField) {
          const baseVal = Number(workingData[rule.sourceField] || 0)
          const rate = Number(rule.rateOrFactor || 0)
          const result = Math.round(baseVal * (rate / 100) * 100) / 100
          computed[rule.targetField] = result
          workingData[rule.targetField] = result
        } else if (rule.formula === 'multiply' && rule.sourceField && rule.secondaryField) {
          const valA = Number(workingData[rule.sourceField] || 0)
          const valB = Number(workingData[rule.secondaryField] || 0)
          const factor = Number(rule.rateOrFactor ?? 1)
          const result = Math.round(valA * valB * factor * 100) / 100
          computed[rule.targetField] = result
          workingData[rule.targetField] = result
        } else if (rule.formula === 'imar_md42_fine') {
          // 3194 Sayılı İmar Kanunu Md. 42 Kaçak Yapı İdari Para Cezası Algoritması
          const alanM2 = Number(workingData['aykirilik_alani_m2'] || 0)
          const birimMaliyet = Number(workingData['birim_maliyet_tl'] || 15000)
          const yapiSinifi = String(workingData['yapi_sinifi'] || 'III')
          const imarDurumu = String(workingData['imar_durumu'] || 'planli')
          const aykirilikTuru = String(workingData['aykirilik_turu'] || 'ruhsatsiz')
          const tehlikeVarMi = Boolean(workingData['kamu_tehlikesi_var_mi'])

          const sinifKatsayilari: Record<string, number> = {
            I: 0.03,
            II: 0.04,
            III: 0.06,
            IV: 0.08,
            V: 0.1
          }
          const sinifKatsayisi = sinifKatsayilari[yapiSinifi] ?? 0.06
          const temelCeza = alanM2 * birimMaliyet * sinifKatsayisi

          // Md. 42/2-c artırım katsayıları
          let artirimCarpani = 1.0
          if (aykirilikTuru === 'ruhsatsiz') artirimCarpani += 1.0 // Ruhsatsız yapım +%100
          if (imarDurumu === 'plansiz') artirimCarpani += 0.5 // İmar 부적합/plansız alan +%50
          if (tehlikeVarMi) artirimCarpani += 1.0 // Can ve mal güvenliği tehlikesi +%100

          const toplamCeza = Math.round(temelCeza * artirimCarpani * 100) / 100
          computed['temel_idari_para_cezasi'] = Math.round(temelCeza * 100) / 100
          computed['artirim_carpani'] = artirimCarpani
          computed[rule.targetField] = toplamCeza
          workingData[rule.targetField] = toplamCeza
        } else if (rule.formula === 'ihale_2886_notice_rule') {
          // 2886 Sayılı Devlet İhale Kanunu Usul ve İlan Süresi Algoritması
          const tahminiBedel = Number(workingData['tahmini_bedel'] || 0)
          const parasalLimit = Number(workingData['parasal_limit'] || 2500000)
          const isKapaliTeklif = tahminiBedel >= parasalLimit

          const belirlenenUsul = isKapaliTeklif
            ? 'Kapalı Teklif Usulü (2886 Md. 36)'
            : 'Açık Teklif Usulü (2886 Md. 45)'
          const ilanKurali = isKapaliTeklif
            ? 'İhale tarihinden en az 10 gün önce Basın İlan Kurumu / Yerel Gazete (2 kez) + 7 gün önce İlan Tahtası (Md. 17)'
            : 'İhale tarihinden en az 7 gün önce İdare ve Belediye İlan Tahtası (Md. 17)'

          computed[rule.targetField] = belirlenenUsul
          computed['zorunlu_ilan_kurali'] = ilanKurali
          workingData[rule.targetField] = belirlenenUsul
        }
      }
    }

    return computed
  }

  /**
   * Form adımını yürütür, varsa adım algoritmalarını (süre/ceza/katsayı) çalıştırır ve kaydeder
   */
  executeFormStep(params: {
    instanceId: string
    stepId: string
    formData: Record<string, unknown>
    actorId: string
    actorName: string
  }): FlowInstance {
    const instance = this.instances.get(params.instanceId)
    if (!instance) throw new Error(`Süreç örneği bulunamadı: ${params.instanceId}`)
    if (instance.status !== 'active')
      throw new Error(`Aktif olmayan süreç üzerinde işlem yapılamaz: ${instance.status}`)

    const definition = this.definitions.get(instance.flowDefinitionId)
    if (!definition) throw new Error(`Süreç tanımı bulunamadı: ${instance.flowDefinitionId}`)

    const step = this.findStep(definition, params.stepId)
    if (!step) throw new Error(`Adım bulunamadı: ${params.stepId}`)
    if (step.type !== 'form') throw new Error(`Bu adım bir form adımı değil: ${step.type}`)

    // Form şemasını doğrula
    if (step.config.formSchemaId) {
      const schema = this.formSchemas.get(step.config.formSchemaId)
      if (schema) {
        for (const field of schema.fields) {
          if (
            field.required &&
            (params.formData[field.id] === undefined ||
              params.formData[field.id] === null ||
              params.formData[field.id] === '')
          ) {
            throw new Error(`Zorunlu alan eksik: ${field.label} (${field.id})`)
          }
        }
      }
    }

    const now = new Date().toISOString()
    const currentAggregated = {
      ...this.getAggregatedData(instance),
      ...params.formData
    }
    const algorithmOutputs = this.evaluateStepAlgorithms(step, currentAggregated, now)

    const exec = instance.stepExecutions[params.stepId]
    if (exec) {
      exec.data = { ...(exec.data || {}), ...params.formData, ...algorithmOutputs }
      exec.status = 'completed'
      exec.completedAt = now
      exec.completedBy = {
        userId: params.actorId,
        userName: params.actorName
      }
    }

    this.logHistory(instance, {
      action: 'step_completed',
      stepId: params.stepId,
      userId: params.actorId,
      userName: params.actorName,
      details: {
        stepTitle: step.title,
        formDataKeys: Object.keys(params.formData),
        computedKeys: Object.keys(algorithmOutputs)
      }
    })

    this.advanceToNextStep(instance, definition, step)
    return instance
  }

  /**
   * Belge üretme adımını yürütür (EBYS Matbu Belge Motoru)
   */
  executeDocumentStep(params: {
    instanceId: string
    stepId: string
    actorId: string
    actorName: string
    customOverrides?: Record<string, unknown>
  }): { instance: FlowInstance; document: DocumentInstance } {
    const instance = this.instances.get(params.instanceId)
    if (!instance) throw new Error(`Süreç örneği bulunamadı: ${params.instanceId}`)

    const definition = this.definitions.get(instance.flowDefinitionId)
    if (!definition) throw new Error(`Süreç tanımı bulunamadı: ${instance.flowDefinitionId}`)

    const step = this.findStep(definition, params.stepId)
    if (!step) throw new Error(`Adım bulunamadı: ${params.stepId}`)
    if (step.type !== 'document') throw new Error(`Bu adım bir belge adımı değil: ${step.type}`)

    const templateId = step.config.templateId
    if (!templateId) throw new Error(`Adımda şablon kimliği (templateId) tanımlanmamış: ${step.id}`)

    const template = this.templates.get(templateId)
    if (!template) throw new Error(`Belge şablonu bulunamadı: ${templateId}`)

    const now = new Date().toISOString()
    const baseAggregated = {
      ...this.getAggregatedData(instance),
      ...(params.customOverrides || {})
    }
    const algorithmOutputs = this.evaluateStepAlgorithms(step, baseAggregated, now)
    const aggregatedData = {
      ...baseAggregated,
      ...algorithmOutputs
    }

    // Resolver: Şablon mapping'lerini çöz
    const resolvedPayload: Record<string, unknown> = {}
    for (const mapping of template.fieldMappings) {
      const val = aggregatedData[mapping.sourceKey] ?? mapping.defaultValue
      resolvedPayload[mapping.placeholder] = val ?? ''
    }

    // Belge HTML çıktısını üret
    const generatedHtml = this.renderDocumentHtml(template, resolvedPayload)

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const docInstance: DocumentInstance = {
      id: docId,
      templateId: template.id,
      templateVersion: template.version,
      flowInstanceId: instance.id,
      stepExecutionId: step.id,
      renderedHtml: generatedHtml,
      metadata: resolvedPayload,
      createdAt: now,
      createdBy: params.actorId,
      status: 'finalized'
    }

    const docs = this.documentInstances.get(instance.id) || []
    docs.push(docInstance)
    this.documentInstances.set(instance.id, docs)

    const exec = instance.stepExecutions[params.stepId]
    if (exec) {
      exec.data = { ...(exec.data || {}), ...algorithmOutputs }
      exec.status = 'completed'
      exec.completedAt = now
      exec.completedBy = {
        userId: params.actorId,
        userName: params.actorName
      }
      exec.documentInstanceIds = [...(exec.documentInstanceIds || []), docId]
    }

    this.logHistory(instance, {
      action: 'document_generated',
      stepId: params.stepId,
      userId: params.actorId,
      userName: params.actorName,
      details: { documentId: docId, templateId: template.id, title: template.title }
    })

    this.advanceToNextStep(instance, definition, step)
    return { instance, document: docInstance }
  }

  /**
   * Görev (task) veya Sistem Eylemi (action) adımını yürütür
   */
  executeTaskStep(params: {
    instanceId: string
    stepId: string
    actorId: string
    actorName: string
    data?: Record<string, unknown>
    notes?: string
  }): FlowInstance {
    const instance = this.instances.get(params.instanceId)
    if (!instance) throw new Error(`Süreç örneği bulunamadı: ${params.instanceId}`)

    const definition = this.definitions.get(instance.flowDefinitionId)
    if (!definition) throw new Error(`Süreç tanımı bulunamadı: ${instance.flowDefinitionId}`)

    const step = this.findStep(definition, params.stepId)
    if (!step) throw new Error(`Adım bulunamadı: ${params.stepId}`)
    if (step.type !== 'task' && step.type !== 'action') {
      throw new Error(`Bu adım bir görev/eylem adımı değil: ${step.type}`)
    }

    const now = new Date().toISOString()
    const baseData = {
      ...this.getAggregatedData(instance),
      ...(params.data || {})
    }
    const algorithmOutputs = this.evaluateStepAlgorithms(step, baseData, now)

    const exec = instance.stepExecutions[params.stepId]
    if (exec) {
      exec.data = { ...(exec.data || {}), ...(params.data || {}), ...algorithmOutputs }
      exec.status = 'completed'
      exec.completedAt = now
      exec.completedBy = {
        userId: params.actorId,
        userName: params.actorName
      }
      exec.notes = params.notes
    }

    this.logHistory(instance, {
      action: 'task_completed',
      stepId: params.stepId,
      userId: params.actorId,
      userName: params.actorName,
      details: { stepTitle: step.title, notes: params.notes }
    })

    this.advanceToNextStep(instance, definition, step)
    return instance
  }

  /**
   * Onay adımını yürütür
   */
  executeApprovalStep(params: {
    instanceId: string
    stepId: string
    decision: 'approved' | 'rejected'
    notes?: string
    actorId: string
    actorName: string
    actorRole?: string
  }): FlowInstance {
    const instance = this.instances.get(params.instanceId)
    if (!instance) throw new Error(`Süreç örneği bulunamadı: ${params.instanceId}`)

    const definition = this.definitions.get(instance.flowDefinitionId)
    if (!definition) throw new Error(`Süreç tanımı bulunamadı: ${instance.flowDefinitionId}`)

    const step = this.findStep(definition, params.stepId)
    if (!step) throw new Error(`Adım bulunamadı: ${params.stepId}`)
    if (step.type !== 'approval') throw new Error(`Bu adım bir onay adımı değil: ${step.type}`)

    const exec = instance.stepExecutions[params.stepId]
    const now = new Date().toISOString()

    if (params.decision === 'approved') {
      const algorithmOutputs = this.evaluateStepAlgorithms(
        step,
        this.getAggregatedData(instance),
        now
      )
      if (exec) {
        exec.data = { ...(exec.data || {}), ...algorithmOutputs }
        exec.status = 'completed'
        exec.completedAt = now
        exec.completedBy = {
          userId: params.actorId,
          userName: params.actorName
        }
        exec.notes = params.notes
      }

      this.logHistory(instance, {
        action: 'step_approved',
        stepId: params.stepId,
        userId: params.actorId,
        userName: params.actorName,
        details: { decision: 'approved', notes: params.notes }
      })

      this.advanceToNextStep(instance, definition, step)
    } else {
      // Reddedildi
      if (exec) {
        exec.status = 'returned'
        exec.completedAt = now
        exec.completedBy = {
          userId: params.actorId,
          userName: params.actorName
        }
        exec.notes = params.notes
      }
      instance.status = 'cancelled'
      this.logHistory(instance, {
        action: 'step_rejected',
        stepId: params.stepId,
        userId: params.actorId,
        userName: params.actorName,
        details: { decision: 'rejected', notes: params.notes }
      })
    }

    return instance
  }

  /**
   * Belge şablonunu ve verileri A4 / HTML formatında derler
   */
  renderDocumentHtml(template: DocumentTemplateDefinition, data: Record<string, unknown>): string {
    let content = template.htmlContent
    for (const [key, val] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      content = content.replace(placeholder, String(val ?? ''))
    }

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${template.title}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; padding: 24px; }
    .header { text-align: center; margin-bottom: 24px; font-weight: bold; }
    .code { font-size: 9pt; color: #555; text-align: right; }
    .content { margin-top: 20px; text-align: justify; }
  </style>
</head>
<body>
  <div class="code">EBYS Belge No: ${template.id} — Sürüm: ${template.version}</div>
  <div class="content">
    ${content}
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Sürece ait belgeleri listeler
   */
  getDocuments(instanceId: string): DocumentInstance[] {
    return this.documentInstances.get(instanceId) || []
  }

  /**
   * Sürecin tarihçe hareketlerini listeler
   */
  getHistory(instanceId: string): FlowHistory[] {
    const instance = this.instances.get(instanceId)
    return instance?.history || []
  }

  // --- Yardımcı İç Metotlar ---

  private findStep(definition: FlowDefinition, stepId: string): FlowStep | undefined {
    for (const group of definition.groups) {
      const step = group.steps.find((s) => s.id === stepId)
      if (step) return step
    }
    return undefined
  }

  private getOrderedSteps(definition: FlowDefinition): { step: FlowStep; groupId: string }[] {
    const allSteps: { step: FlowStep; groupId: string }[] = []
    const sortedGroups = definition.groups.slice().sort((a, b) => a.order - b.order)
    for (const group of sortedGroups) {
      const sortedSteps = group.steps.slice().sort((a, b) => a.order - b.order)
      for (const step of sortedSteps) {
        allSteps.push({ step, groupId: group.id })
      }
    }
    return allSteps
  }

  private resolveBranchTargetStepId(
    step: FlowStep,
    aggregatedData: Record<string, unknown>
  ): { targetStepId: string; matchedReason?: string } | null {
    if (step.config.conditionRules && step.config.conditionRules.length > 0) {
      for (const rule of step.config.conditionRules) {
        if (evaluateConditionRule(rule, aggregatedData)) {
          return {
            targetStepId: rule.targetStepId,
            matchedReason:
              rule.reason || `${rule.field} ${rule.operator} ${String(rule.value)} -> ${rule.targetStepId}`
          }
        }
      }
      if (step.config.defaultTargetStepId) {
        return {
          targetStepId: step.config.defaultTargetStepId,
          matchedReason: `Varsayılan dal -> ${step.config.defaultTargetStepId}`
        }
      }
    }
    return null
  }

  private advanceToNextStep(
    instance: FlowInstance,
    definition: FlowDefinition,
    completedStep?: FlowStep
  ): void {
    const allSteps = this.getOrderedSteps(definition)
    const currentIndex = allSteps.findIndex((item) => item.step.id === instance.currentStepId)
    const now = new Date().toISOString()

    // 1. Tamamlanan adım bir dalın sonlandırıcı (terminalStep) adımıysa, kalan alternatif dal adımlarını 'skipped' yap ve süreci bitir
    if (completedStep?.config.customParams?.terminalStep === true) {
      for (let i = currentIndex + 1; i < allSteps.length; i++) {
        const remStep = allSteps[i].step
        const remExec = instance.stepExecutions[remStep.id]
        if (remExec && remExec.status === 'pending') {
          remExec.status = 'skipped'
          remExec.completedAt = now
        }
      }
      instance.status = 'completed'
      instance.updatedAt = now
      instance.currentStepId = undefined

      this.logHistory(instance, {
        action: 'process_completed',
        stepId: completedStep.id,
        userId: 'system',
        userName: 'Süreç ve Algoritma Motoru',
        details: {
          message: `Sonlandırıcı dal adımı (${completedStep.title}) tamamlandı; alternatif dal adımları atlandı.`
        }
      })
      return
    }

    // 2. Tamamlanan adımda koşullu dallanma kuralı (conditionRules) tanımlı mı?
    const aggregatedData = this.getAggregatedData(instance)
    const branchDecision = completedStep
      ? this.resolveBranchTargetStepId(completedStep, aggregatedData)
      : null

    let nextIndex = currentIndex + 1
    if (branchDecision) {
      const targetIdx = allSteps.findIndex((item) => item.step.id === branchDecision.targetStepId)
      if (targetIdx > currentIndex) {
        // Arada kalan diğer dala ait adımları 'skipped' olarak işaretle
        const skippedStepIds: string[] = []
        for (let i = currentIndex + 1; i < targetIdx; i++) {
          const bypassedStep = allSteps[i].step
          const bypassedExec = instance.stepExecutions[bypassedStep.id]
          if (bypassedExec && bypassedExec.status === 'pending') {
            bypassedExec.status = 'skipped'
            bypassedExec.completedAt = now
            skippedStepIds.push(bypassedStep.id)
          }
        }
        nextIndex = targetIdx
        this.logHistory(instance, {
          action: 'algorithmic_branch_selected',
          stepId: completedStep?.id,
          userId: 'system',
          userName: 'Süreç ve Algoritma Motoru',
          details: {
            targetStepId: branchDecision.targetStepId,
            reason: branchDecision.matchedReason,
            skippedStepIds
          }
        })
      }
    }

    if (nextIndex >= 0 && nextIndex < allSteps.length) {
      const nextItem = allSteps[nextIndex]
      instance.currentStepId = nextItem.step.id

      const nextExecution = instance.stepExecutions[nextItem.step.id]
      if (nextExecution) {
        nextExecution.status = 'in_progress'
        nextExecution.startedAt = now
      }

      this.logHistory(instance, {
        action: 'step_started',
        stepId: nextItem.step.id,
        userId: 'system',
        userName: 'Süreç Motoru',
        details: { nextStepTitle: nextItem.step.title }
      })

      // 3. Eğer yeni geçilen adım saf bir 'condition' (otomatik karar düğümü) adımıysa, otomatik değerlendir ve ilerlet
      if (nextItem.step.type === 'condition') {
        if (nextExecution) {
          nextExecution.status = 'completed'
          nextExecution.completedAt = now
        }
        this.advanceToNextStep(instance, definition, nextItem.step)
      }
    } else {
      // Tüm adımlar bitti: Süreç tamamlandı
      instance.status = 'completed'
      instance.updatedAt = now
      instance.currentStepId = undefined

      this.logHistory(instance, {
        action: 'process_completed',
        userId: 'system',
        userName: 'Süreç Motoru',
        details: { message: 'Tüm aşama ve adımlar tamamlandı.' }
      })
    }
  }

  private logHistory(
    instance: FlowInstance,
    entry: {
      action: string
      stepId?: string
      userId: string
      userName: string
      details?: Record<string, unknown>
    }
  ): void {
    instance.history.push({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      instanceId: instance.id,
      stepId: entry.stepId,
      action: entry.action,
      userId: entry.userId,
      userName: entry.userName,
      timestamp: new Date().toISOString(),
      details: entry.details
    })
  }
}
