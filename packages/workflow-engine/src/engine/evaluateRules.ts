import { RuleDefinition, RuleResult, WorkflowContext } from '../types'

export interface RuleEvaluationSummary {
  passed: boolean
  hasBlockingErrors: boolean
  hasWarnings: boolean
  blockingErrors: RuleResult[]
  warnings: RuleResult[]
  advisories: RuleResult[]
  allResults: RuleResult[]
}

export async function evaluateRules(
  ruleIds: string[],
  ruleRegistry: Map<string, RuleDefinition> | RuleDefinition[],
  context: WorkflowContext
): Promise<RuleEvaluationSummary> {
  const registryMap = Array.isArray(ruleRegistry)
    ? new Map(ruleRegistry.map((r) => [r.id, r]))
    : ruleRegistry

  const allResults: RuleResult[] = []

  for (const ruleId of ruleIds) {
    const rule = registryMap.get(ruleId)
    if (!rule) {
      allResults.push({
        ruleId,
        ruleTitle: ruleId,
        passed: false,
        severity: 'WARNING',
        category: 'ORGANIZATIONAL',
        message: `Kural tanımı sistemde bulunamadı: ${ruleId}`,
        suggestedAction: 'Sistem yöneticisine başvurunuz.'
      })
      continue
    }

    try {
      const res = await Promise.resolve(rule.evaluate(context))
      allResults.push(res)
    } catch (err: any) {
      allResults.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        passed: false,
        severity: 'BLOCKING',
        category: rule.category,
        message: `Kural değerlendirme hatası: ${err?.message || err}`,
        sourceReference: rule.sourceReference
      })
    }
  }

  const blockingErrors = allResults.filter((r) => !r.passed && r.severity === 'BLOCKING')
  const warnings = allResults.filter((r) => !r.passed && r.severity === 'WARNING')
  const advisories = allResults.filter((r) => r.category === 'ADVISORY' || r.severity === 'INFO')

  return {
    passed: blockingErrors.length === 0,
    hasBlockingErrors: blockingErrors.length > 0,
    hasWarnings: warnings.length > 0,
    blockingErrors,
    warnings,
    advisories,
    allResults
  }
}
