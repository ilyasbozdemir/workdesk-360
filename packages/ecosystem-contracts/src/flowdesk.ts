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
// 4. JSON Tabanlı Süreç ve Algoritma Tanımları (FlowDefinition)
// ============================================================================

/**
 * Kanuni Süre Hesaplama Kuralı (Örn: 3194 Md. 32 Mühürlemeden itibaren 30 gün,
 * 2886 Md. 31 Komisyon kararından itibaren 15 iş günü, 2886 Md. 54 Tebliğden itibaren 15 gün)
 */
export interface FlowDeadlineRule {
  sourceDateField?: string       // Örn: 'muhurleme_tarihi' veya 'teblig_tarihi' (yoksa adım tamamlanma tarihi)
  durationDays: number           // Örn: 30, 15, 10, 7
  dayType: 'calendar' | 'business'
  targetDateField: string        // Hesaplanan son tarihin yazılacağı alan (Örn: 'yasal_sure_bitis_tarihi')
  description: string            // Mevzuat dayanağı açıklaması
}

/**
 * Algoritmik Hesaplama ve Mevzuat Katsayı Kuralı
 */
export interface FlowComputedFieldRule {
  targetField: string            // Hesaplanan değerin yazılacağı alan
  formula:
    | 'percentage'               // sourceField * (rateOrFactor / 100)
    | 'multiply'                 // sourceField * secondaryField * (rateOrFactor || 1)
    | 'imar_md42_fine'           // 3194 Sayılı İmar Kanunu Md. 42 Kaçak Yapı İdari Para Cezası Algoritması
    | 'ihale_2886_notice_rule'   // 2886 Sayılı Kanun Tahmini Bedel -> İhale Usulü ve İlan Süresi Algoritması
  sourceField?: string
  secondaryField?: string
  rateOrFactor?: number
  description?: string
}

/**
 * Algoritmik Koşullu Dallanma Kuralı (Karar Ağacı)
 */
export interface FlowConditionRule {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
  value: unknown
  targetStepId: string
  reason?: string
}

export interface FlowStepConfig {
  formSchemaId?: string
  templateId?: string
  actionName?: string
  approvalRoles?: string[]
  assigneeType?: 'user' | 'unit'
  assigneeId?: string
  deadlineRule?: FlowDeadlineRule
  computedFields?: FlowComputedFieldRule[]
  conditionRules?: FlowConditionRule[]
  defaultTargetStepId?: string
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
  category:
    | 'procurement'
    | 'hr'
    | 'real-estate'
    | 'urban-inspection'
    | 'legal-enforcement'
    | 'official-letter'
    | 'general'
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
