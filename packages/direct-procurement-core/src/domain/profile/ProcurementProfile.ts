import type { DeductionRule } from './DeductionRule'

/**
 * Bir profil türetilirken yapılacak ekleme/çıkarma değişiklikleri.
 */
export interface ProfileChanges {
  /** Profili genişletirken eklenecek şablon / belge kimlikleri */
  addDocuments?: string[]
  /** Üst profilden çıkarılacak şablon / belge kimlikleri */
  removeDocuments?: string[]
  /** Profili genişletirken eklenecek yasal kesinti kuralları */
  addDeductions?: DeductionRule[]
  /** Üst profilden çıkarılacak kesinti kuralları ID listesi */
  removeDeductions?: string[]
  /** İhale komisyonu / ihale kararı gerektirip gerektirmediği (Doğrudan teminde `false`) */
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
 * Alım Türü Profili (Procurement Profile).
 * 
 * Doğrudan Temin (22/a, 22/b, 22/c, 22/d) ve ihale türlerinin gerektirdiği belge şablonlarını,
 * yasal vergi/kesinti kurallarını ve süreç kısıtlamalarını yöneten değişmez (immutable) nesnedir.
 * 
 * Kalıtım yerine kompozisyon kullanır; `extend()` metodu mevcut profili değiştirmeden
 * yeni bir türetilmiş profil üretir.
 */
export class ProcurementProfile {
  private constructor(private readonly s: ProfileState) {}

  /**
   * Kök (temel) bir alım profili oluşturur.
   * 
   * @param id - Profil kimliği
   * @param label - Kullanıcı arayüzünde gösterilecek etiket
   * @param init - Başlangıç belgeleri ve kesinti kuralları
   */
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

  /**
   * Mevcut profili temel alarak yeni bir alım profili türetir.
   * 
   * @param id - Yeni profil kimliği
   * @param label - Yeni profil etiketi
   * @param c - Eklenecek ve çıkarılacak belge/kesinti kuralları
   * @returns Yeni türetilmiş ProcurementProfile nesnesi
   */
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

  /** Profil kimliği */
  get id(): string { return this.s.id }
  /** Profilin kullanıcı dostu adı */
  get label(): string { return this.s.label }
  /** Profilin türediği üst profil kimlikleri silsilesi */
  get lineage(): readonly string[] { return this.s.lineage }
  /** Bu profilde geçerli olan zorunlu/izin verilen belge şablonları listesi */
  get documents(): readonly string[] { return this.s.documents }
  /** Bu profilde uygulanan yasal kesinti kuralları (Damga vergisi, karar pulu vb.) */
  get deductions(): readonly DeductionRule[] { return this.s.deductions }
  /** Bu alımda resmî bir ihale kararı pulu alınıp alınmayacağı */
  get hasTenderDecision(): boolean { return this.s.hasTenderDecision }

  /**
   * Belirtilen kesinti kuralının bu profilde tanımlı olup olmadığını denetler.
   * @param id - Kesinti kuralı kimliği (Örn: 'karar-pulu', 'damga-vergisi').
   */
  hasDeduction(id: string): boolean {
    return this.s.deductions.some((d) => d.id === id)
  }
}
