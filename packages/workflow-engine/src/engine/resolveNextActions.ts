import {
  WorkflowDefinition,
  WorkflowTransitionDefinition,
  WorkflowContext
} from '../types'
import { evaluateTransition, TransitionEvaluationResult } from './evaluateTransition'

export interface AvailableActionItem {
  transition: WorkflowTransitionDefinition
  evaluation: TransitionEvaluationResult
}

export async function resolveNextActions(
  definition: WorkflowDefinition,
  context: WorkflowContext
): Promise<AvailableActionItem[]> {
  const matchingTransitions = definition.transitions.filter(
    (t) => t.fromState === context.currentState
  )

  const actions: AvailableActionItem[] = []

  for (const t of matchingTransitions) {
    const evaluation = await evaluateTransition(definition, t.id, context)
    actions.push({
      transition: t,
      evaluation
    })
  }

  return actions
}
