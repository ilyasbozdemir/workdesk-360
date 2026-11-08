export type WorkflowStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'WAITING_APPROVAL'
  | 'WAITING_DOCUMENT'
  | 'WAITING_REVIEW'
  | 'RETURNED'
  | 'COMPLETED'
  | 'CANCELLED'

export type RuleCategory = 'LEGAL' | 'ORGANIZATIONAL' | 'ADVISORY'

export type RuleSeverity = 'INFO' | 'WARNING' | 'BLOCKING'

export interface RuleResult {
  ruleId: string
  ruleTitle: string
  passed: boolean
  severity: RuleSeverity
  category: RuleCategory
  message: string
  explanation?: string
  suggestedAction?: string
  sourceReference?: string
}

export interface RuleDefinition {
  id: string
  version: number
  title: string
  category: RuleCategory
  severity: RuleSeverity
  sourceReference?: string
  effectiveFrom?: string
  effectiveTo?: string
  evaluate: (context: WorkflowContext) => Promise<RuleResult> | RuleResult
}

export interface WorkflowTransitionDefinition {
  id: string
  fromState: string
  toState: string
  actionName: string
  actionLabel: string
  requiredRole?: string
  requiredPermission?: string
  rules: string[] // Rule ID'leri
  targetAssigneeRole?: string
  createsTask?: {
    title: string
    description?: string
    requiredRole?: string
  }
  generatesNotification?: {
    type: string
    title: string
    template: string
    notifyChannels: ('IN_APP' | 'EMAIL')[]
  }
}

export interface WorkflowStateDefinition {
  id: string
  name: string
  label: string
  category: 'PREPARATION' | 'MARKET' | 'ORDER' | 'ACCEPTANCE' | 'FINANCE' | 'ACCOUNTING' | 'DONE'
  description: string
  isInitial?: boolean
  isTerminal?: boolean
  allowedTransitions: string[] // Transition ID'leri
  requiredDocuments?: string[]
}

export interface WorkflowDefinition {
  id: string
  version: number
  name: string
  description: string
  entityType: string
  initialState: string
  states: WorkflowStateDefinition[]
  transitions: WorkflowTransitionDefinition[]
  rules: RuleDefinition[]
}

export interface WorkflowContext {
  dosyaId: number
  dosyaNo?: string
  konu?: string
  tur?: string // 'mal' | 'hizmet' | 'yapim'
  yaklasikMaliyet?: number
  netTutar?: number
  butceTertibi?: string
  hasOnayBelgesi?: boolean
  hasPiyasaArastirmasi?: boolean
  teklifSayisi?: number
  kazananFirmaId?: number
  kazananFirmaUnvan?: string
  hasSiparisMektubu?: boolean
  hasMuayeneKabul?: boolean
  hasFatura?: boolean
  faturaNo?: string
  hasMif?: boolean
  hasOeb?: boolean
  currentState: string
  actorId?: string
  actorRole?: string
  extra?: Record<string, any>
}

export interface WorkflowInstance {
  id: string
  dosyaId: number
  definitionId: string
  definitionVersion: number
  currentState: string
  status: WorkflowStatus
  assignedUserId?: string
  assignedUnitId?: string
  assignedRole?: string
  lastActorId?: string
  returnReason?: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowTask {
  id: string
  instanceId: string
  dosyaId: number
  title: string
  description?: string
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED'
  assignedUserId?: string
  assignedUnitId?: string
  requiredRole?: string
  dueAt?: string
  createdAt: string
  completedAt?: string
  completedBy?: string
  returnReason?: string
  idempotencyKey?: string
}

export interface WorkflowEvent {
  id: string
  instanceId: string
  dosyaId: number
  eventType: string
  fromState?: string
  toState?: string
  actorId?: string
  actorRole?: string
  reason?: string
  metadataJson?: string
  timestamp: string
}

export interface WorkflowNotification {
  id: string
  taskId?: string
  dosyaId: number
  userId?: string
  title: string
  message: string
  type: string
  channel: 'IN_APP' | 'EMAIL'
  readAt?: string
  createdAt: string
}

