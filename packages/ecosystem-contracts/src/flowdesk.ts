/**
 * FlowDesk — Dinamik Süreç Tasarımı, JSON Tabanlı İş Akışları ve Belge Üretim Sözleşmeleri
 * 
 * FlowDesk, genel amaçlı bir süreç tanımlama, süreç yürütme, görev yönetimi
 * ve modüler belge üretim (EBYS mantığı) motorudur.
 */

// ============================================================================
// 1. Dinamik İşlem Adımı Türleri
// ============================================================================

export type FlowStepType =
  | 'form'        // Form üzerinden yapılandırılmış veri toplama
  | 'document'    // Şablon üzerinden belge oluşturma (EBYS)
  | 'task'        // Kullanıcıya veya birime görev atama ve tamamlama
  | 'approval'    // Yetkili onay kararı (kabul / ret / iade)
  | 'condition'   // Koşula göre sonraki adımı dinamik belirleme
  | 'action'      // Kayıtlı sistem işlevini tetikleme (güvenli, whitelist edilmiş)

// ============================================================================
// 2. JSON Tabanlı Form Altyapısı
// ============================================================================

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'note'

export interface FormFieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  customMessage?: string
}

export interface FormSelectOption {
  label: string
  value: string | number
  description?: string
}

export interface FormFieldDefinition {
  id: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  defaultValue?: unknown
  options?: FormSelectOption[]
  validation?: FormFieldValidation
  helpText?: string
  order: number
}

export interface FormSchema {
  id: string
  title: string
  description?: string
  version: number
  fields: FormFieldDefinition[]
}

// ============================================================================
// 3. Ortak Belge Üretim Altyapısı (EBYS Mantığı)
// ============================================================================

export type DocumentOutputFormat = 'html' | 'pdf'

export interface DocumentFieldMapping {
  placeholder: string      // örn: 'muhammen_bedel'
  sourceType: 'instance_data' | 'step_data' | 'system' | 'custom'
  sourceKey: string        // örn: 'tahmini_bedel' veya 'kurum_adi'
  defaultValue?: string
  description?: string
}

export interface DocumentTemplateDefinition {
  id: string               // örn: '2886-EVR-01'
  title: string            // örn: 'Başkanlık Makamı Onay Belgesi'
  category: string         // örn: 'ihale_onay' | 'tutanak' | 'karar' | 'sozlesme'
  version: number
  htmlContent: string      // HTML iskeleti (Mustache / Handlebars tarzı {{placeholder}})
  fieldMappings: DocumentFieldMapping[]
  supportedOutputs: DocumentOutputFormat[]
}

export interface DocumentResolverDefinition {
  templateId: string
  resolverName: string
  description: string
  requiredFields: string[]
}

export interface DocumentInstance {
  id: string
  templateId: string
  templateVersion: number
  flowInstanceId: string
  stepExecutionId: string
  renderedHtml: string
  metadata: Record<string, unknown>
  createdAt: string
  createdBy: string
  pdfArtifactPath?: string
  status: 'draft' | 'finalized' | 'archived'
}

// ============================================================================
// 4. JSON Tabanlı Süreç Tanımları (FlowDefinition)
// ============================================================================

export interface FlowStepConfig {
  formSchemaId?: string
  templateId?: string
  actionName?: string
  approvalRoles?: string[]
  assigneeType?: 'user' | 'unit'
  assigneeId?: string
  conditionRules?: Array<{
    field: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
    value: unknown
    targetStepId: string
  }>
  customParams?: Record<string, unknown>
}

export interface FlowStep {
  id: string
  title: string
  type: FlowStepType
  order: number
  description?: string
  config: FlowStepConfig
}

export interface FlowGroup {
  id: string
  title: string
  order: number
  description?: string
  steps: FlowStep[]
}

export interface FlowTransition {
  fromStepId: string
  toStepId: string
  conditionExpr?: string
}

export interface FlowDefinition {
  schemaVersion: number
  id: string
  name: string
  version: number
  status: 'draft' | 'published' | 'archived'
  description?: string
  moduleId?: string
  category: string
  groups: FlowGroup[]
  transitions?: FlowTransition[]
}

// ============================================================================
// 5. Süreç Yürütme (FlowInstance, StepExecution, Task, History)
// ============================================================================

export type StepExecutionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'returned'
  | 'skipped'

export interface FlowStepExecution {
  stepId: string
  status: StepExecutionStatus
  startedAt?: string
  completedAt?: string
  completedBy?: {
    userId: string
    userName: string
    unitId?: string
  }
  data?: Record<string, unknown>
  documentInstanceIds?: string[]
  notes?: string
}

export interface FlowTask {
  id: string
  instanceId: string
  stepId: string
  title: string
  assignedTo: {
    type: 'user' | 'unit'
    id: string
    name: string
  }
  status: 'open' | 'in_progress' | 'completed' | 'returned'
  dueDate?: string
  createdAt: string
  completedAt?: string
}

export interface FlowHistory {
  id: string
  instanceId: string
  stepId?: string
  action: string
  userId: string
  userName: string
  timestamp: string
  details?: Record<string, unknown>
}

export interface FlowInstance {
  id: string
  flowDefinitionId: string
  flowDefinitionVersion: number
  title: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  currentStepId?: string
  createdAt: string
  updatedAt: string
  createdBy: {
    userId: string
    userName: string
    unitId?: string
  }
  stepExecutions: Record<string, FlowStepExecution>
  history: FlowHistory[]
}

// ============================================================================
// 6. Modüler Yapı ve Market Sözleşmesi (FlowdeskModuleManifest)
// ============================================================================

export interface FlowdeskModuleManifest {
  id: string                     // örn: 'module-devlet-ihale-2886'
  name: string                   // örn: '2886 Devlet İhale Kanunu Modülü'
  version: string                // örn: '1.0.0'
  flowdeskVersionRange: string   // örn: '>=1.0.0'
  summary: string
  description: string
  category: 'procurement' | 'hr' | 'real-estate' | 'official-letter' | 'general'
  author: string
  repositoryUrl?: string
  flows: FlowDefinition[]
  formSchemas: FormSchema[]
  documentTemplates: DocumentTemplateDefinition[]
  resolvers: DocumentResolverDefinition[]
  capabilities: string[]
  isInstalled?: boolean
  isEnabled?: boolean
}
