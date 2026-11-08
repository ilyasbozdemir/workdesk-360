import {
  WorkflowDefinition,
  WorkflowTransitionDefinition,
  WorkflowContext,
  RuleResult
} from '../types'
import { evaluateRules, RuleEvaluationSummary } from './evaluateRules'

export interface TransitionEvaluationResult {
  canTransition: boolean
  transition?: WorkflowTransitionDefinition
  blockingReasons: string[]
  warningReasons: string[]
  ruleSummary: RuleEvaluationSummary
}

export async function evaluateTransition(
  definition: WorkflowDefinition,
  transitionId: string,
  context: WorkflowContext
): Promise<TransitionEvaluationResult> {
  const transition = definition.transitions.find((t) => t.id === transitionId)
  if (!transition) {
    return {
      canTransition: false,
      blockingReasons: [`Tanımsız geçiş işlemi: ${transitionId}`],
      warningReasons: [],
      ruleSummary: {
        passed: false,
        hasBlockingErrors: true,
        hasWarnings: false,
        blockingErrors: [],
        warnings: [],
        advisories: [],
        allResults: []
      }
    }
  }

  const blockingReasons: string[] = []
  const warningReasons: string[] = []

  // 1. Durum Kontrolü (State mismatch)
  if (transition.fromState !== context.currentState) {
    blockingReasons.push(
      `Bu işlem mevcut durum (${context.currentState}) için uygulanamaz. Gerekli durum: ${transition.fromState}`
    )
  }

  // 2. Rol / Yetki Kontrolü
  if (transition.requiredRole && context.actorRole) {
    const isAdmin = context.actorRole === 'admin'
    if (!isAdmin && context.actorRole !== transition.requiredRole) {
      blockingReasons.push(
        `Yetki yetersiz: Bu işlemi gerçekleştirmek için '${transition.requiredRole}' yetkisi gereklidir (Mevcut rol: ${context.actorRole}).`
      )
    }
  }

  // 3. Kural Değerlendirmesi
  const ruleSummary = await evaluateRules(transition.rules, definition.rules, context)

  if (ruleSummary.hasBlockingErrors) {
    for (const b of ruleSummary.blockingErrors) {
      blockingReasons.push(b.message)
    }
  }

  if (ruleSummary.hasWarnings) {
    for (const w of ruleSummary.warnings) {
      warningReasons.push(w.message)
    }
  }

  return {
    canTransition: blockingReasons.length === 0,
    transition,
    blockingReasons,
    warningReasons,
    ruleSummary
  }
}

