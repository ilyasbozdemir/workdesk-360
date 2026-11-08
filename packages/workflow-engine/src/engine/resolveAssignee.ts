import { WorkflowTransitionDefinition, WorkflowContext } from '../types'

export interface AssigneeResolution {
  role?: string
  unitId?: string
  userId?: string
}

export function resolveAssignee(
  transition: WorkflowTransitionDefinition,
  context: WorkflowContext
): AssigneeResolution {
  const targetRole = transition.targetAssigneeRole || transition.createsTask?.requiredRole

  return {
    role: targetRole,
    unitId: undefined, // Spesifik birim atanmışsa context'ten genişletilebilir
    userId: undefined  // Belirli bir kullanıcı atanmışsa
  }
}
