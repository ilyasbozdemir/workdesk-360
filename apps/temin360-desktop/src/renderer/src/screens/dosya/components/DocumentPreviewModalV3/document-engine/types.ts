import { TemplateOptionItem } from '../templateResolver'

export type { TemplateOptionItem }

export type DocumentSource =
  | { kind: 'ihtiyacRaporu'; raporId: number }
  | { kind: 'dosya'; dosyaId: number; documentId?: string }

export interface DocumentResolveContext {
  invitedFirms?: unknown[]
  [key: string]: unknown
}

export interface DocumentResolveResult {
  resolvedData: Record<string, unknown>
  formData: Record<string, unknown>
  personelListesi?: unknown[]
  birimListesi?: unknown[]
  firmaListesi?: unknown[]
  dosyaRecord?: unknown
  raporRecord?: unknown
  activeLogoLeft?: boolean
  activeLogoRight?: boolean
  activeOrientation?: 'portrait' | 'landscape'
  initialSnapshotJson?: string
}

export interface DocumentResolver {
  templates(source: DocumentSource): Promise<TemplateOptionItem[]>
  resolve(
    source: DocumentSource,
    templateId: string,
    context?: DocumentResolveContext
  ): Promise<DocumentResolveResult>
}
