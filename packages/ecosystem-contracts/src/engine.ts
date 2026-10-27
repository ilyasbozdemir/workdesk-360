/**
 * FlowDesk — Genel Süreç ve Belge Yürütme Motoru (Process & Document Engine)
 * 
 * Kurumdaki tüm iş akışlarını (2886 Devlet İhale Süreci, Doğrudan Temin, Personel İzin/Görev, vb.)
 * JSON tabanlı tanımlar üzerinden genel amaçlı olarak yürüten, form verilerini toplayan,
 * onay adımlarını işleten ve EBYS matbu belgelerini üreten çekirdek motor.
 */

import type {
  FlowDefinition,
  FlowInstance,
  FlowStep,
  FlowStepExecution,
  FlowHistory,
  FormSchema,
  DocumentTemplateDefinition,
  DocumentInstance
} from './flowdesk.js'

export class FlowEngine {
  private instances: Map<string, FlowInstance> = new Map()
  private definitions: Map<string, FlowDefinition> = new Map()
  private templates: Map<string, DocumentTemplateDefinition> = new Map()
  private formSchemas: Map<string, FormSchema> = new Map()
  private documentInstances: Map<string, DocumentInstance[]> = new Map()

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
   * Yeni bir süreç başlatır (Örn: 2886 İhalesi, İzin Talebi, Satın Alma vb.)
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
      throw new Error(`Sadece 'published' durumundaki süreç tanımları başlatılabilir. Mevcut durum: ${definition.status}`)
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
   * Süreçteki toplanan tüm form verilerini birleştirir
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
   * Form adımını yürütür ve form verilerini kaydeder
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
    if (instance.status !== 'active') throw new Error(`Aktif olmayan süreç üzerinde işlem yapılamaz: ${instance.status}`)

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
          if (field.required && (params.formData[field.id] === undefined || params.formData[field.id] === null || params.formData[field.id] === '')) {
            throw new Error(`Zorunlu alan eksik: ${field.label} (${field.id})`)
          }
        }
      }
    }

    const exec = instance.stepExecutions[params.stepId]
    if (exec) {
      exec.data = { ...(exec.data || {}), ...params.formData }
      exec.status = 'completed'
      exec.completedAt = new Date().toISOString()
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
      details: { stepTitle: step.title, formDataKeys: Object.keys(params.formData) }
    })

    this.advanceToNextStep(instance, definition)
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

    // Süreçteki tüm form verilerini topla
    const aggregatedData = {
      ...this.getAggregatedData(instance),
      ...(params.customOverrides || {})
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
      createdAt: new Date().toISOString(),
      createdBy: params.actorId,
      status: 'finalized'
    }

    const docs = this.documentInstances.get(instance.id) || []
    docs.push(docInstance)
    this.documentInstances.set(instance.id, docs)

    const exec = instance.stepExecutions[params.stepId]
    if (exec) {
      exec.status = 'completed'
      exec.completedAt = new Date().toISOString()
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

    this.advanceToNextStep(instance, definition)
    return { instance, document: docInstance }
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
      if (exec) {
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

      this.advanceToNextStep(instance, definition)
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
      const step = group.steps.find(s => s.id === stepId)
      if (step) return step
    }
    return undefined
  }

  private advanceToNextStep(instance: FlowInstance, definition: FlowDefinition): void {
    const allSteps: { step: FlowStep; groupId: string }[] = []
    const sortedGroups = definition.groups.slice().sort((a, b) => a.order - b.order)
    for (const group of sortedGroups) {
      const sortedSteps = group.steps.slice().sort((a, b) => a.order - b.order)
      for (const step of sortedSteps) {
        allSteps.push({ step, groupId: group.id })
      }
    }

    const currentIndex = allSteps.findIndex(item => item.step.id === instance.currentStepId)
    if (currentIndex >= 0 && currentIndex < allSteps.length - 1) {
      const nextItem = allSteps[currentIndex + 1]
      instance.currentStepId = nextItem.step.id

      const nextExecution = instance.stepExecutions[nextItem.step.id]
      if (nextExecution) {
        nextExecution.status = 'in_progress'
        nextExecution.startedAt = new Date().toISOString()
      }

      this.logHistory(instance, {
        action: 'step_started',
        stepId: nextItem.step.id,
        userId: 'system',
        userName: 'Süreç Motoru',
        details: { nextStepTitle: nextItem.step.title }
      })
    } else {
      // Tüm adımlar bitti: Süreç tamamlandı
      instance.status = 'completed'
      instance.updatedAt = new Date().toISOString()
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
