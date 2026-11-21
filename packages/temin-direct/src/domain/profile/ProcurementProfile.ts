import type { DeductionRule } from './DeductionRule'

export interface ProfileChanges {
  addDocuments?: string[]
  removeDocuments?: string[]
  addDeductions?: DeductionRule[]
  removeDeductions?: string[]
  hasTenderDecision?: boolean
}

interface ProfileState {
  id: string
  label: string
  lineage: readonly string[]
  documents: readonly string[]
  deductions: readonly DeductionRule[]
  hasTenderDecision: boolean
}

/**
 * Alım türü profili. Değiştirilemez; `extend()` yeni profil döndürür (kalıtım yerine kompozisyon).
 * Önce üstten remove uygulanır, sonra add eklenir; aynı id'li kural üsttekini ezer.
 */
export class ProcurementProfile {
  private constructor(private readonly s: ProfileState) {}

  static root(
    id: string,
    label: string,
    init: { documents: string[]; deductions?: DeductionRule[]; hasTenderDecision?: boolean },
  ): ProcurementProfile {
    return new ProcurementProfile({
      id,
      label,
      lineage: [id],
      documents: [...init.documents],
      deductions: [...(init.deductions ?? [])],
      hasTenderDecision: init.hasTenderDecision ?? false,
    })
  }

  extend(id: string, label: string, c: ProfileChanges = {}): ProcurementProfile {
    const removeDocs = new Set(c.removeDocuments ?? [])
    const documents = [
      ...new Set([...this.s.documents.filter((d) => !removeDocs.has(d)), ...(c.addDocuments ?? [])]),
    ]

    const removeIds = new Set(c.removeDeductions ?? [])
    const added = c.addDeductions ?? []
    const addedIds = new Set(added.map((d) => d.id))
    const deductions = [
      ...this.s.deductions.filter((d) => !removeIds.has(d.id) && !addedIds.has(d.id)),
      ...added,
    ]

    return new ProcurementProfile({
      id,
      label,
      lineage: [...this.s.lineage, id],
      documents,
      deductions,
      hasTenderDecision: c.hasTenderDecision ?? this.s.hasTenderDecision,
    })
  }

  get id(): string { return this.s.id }
  get label(): string { return this.s.label }
  get lineage(): readonly string[] { return this.s.lineage }
  get documents(): readonly string[] { return this.s.documents }
  get deductions(): readonly DeductionRule[] { return this.s.deductions }
  get hasTenderDecision(): boolean { return this.s.hasTenderDecision }

  hasDeduction(ruleId: string): boolean {
    return this.s.deductions.some((d) => d.id === ruleId)
  }

  explain(): string {
    return [
      `Profil: ${this.label} (${this.lineage.join(' -> ')})`,
      `Belgeler: ${this.documents.join(', ') || '-'}`,
      `Kesintiler: ${this.deductions.map((d) => d.id).join(', ') || 'yok'}`,
      `İhale kararı: ${this.hasTenderDecision ? 'var' : 'yok'}`,
    ].join('\n')
  }
}
