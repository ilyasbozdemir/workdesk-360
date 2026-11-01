export type RefreshPolicy = "source" | "preserve" | "manual";

export interface TableColumnMapping {
  tablo?: string;
  sutun?: string;
  iliskili_id?: string;
  iliskiliTablo?: string;
  iliskiliSutun?: string;
  deger?: unknown;
  varsayilan?: unknown;
  altEslestirme?: Record<string, TableColumnMapping>;
  formul?: string;
  aciklama?: string;

  /** Snapshot refresh davranışı; eski mapping'lerde verilmezse source kabul edilir. */
  refreshPolicy?: RefreshPolicy;
}

export type ProcessMapping = Record<string, TableColumnMapping>;

export interface TemplateDefinition {
  templateId: string;
  templateVersion: number;
  schemaVersion: number;
  mustacheFile: string;
  mapping: ProcessMapping;
}

export interface ResolveContext {
  documentId: string;
  templateId: string;
}

export interface DocumentDataSource {
  /** Mapping satırını uygulamanın SQL/query katmanında çözer. */
  resolve(
    mapping: TableColumnMapping,
    context: ResolveContext
  ): Promise<unknown>;
}

export interface SnapshotOverride {
  value: unknown;
  updatedAt: string;
  updatedBy?: string;
}

export interface SnapshotEnvelope<TData extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  documentId: string;
  templateId: string;
  templateVersion: number;
  schemaVersion: number;
  revision: number;
  createdAt: string;
  sourceUpdatedAt?: string;
  data: TData;
  /** Path -> kullanıcı tarafından açıkça override edilmiş değer. */
  overrides: Record<string, SnapshotOverride>;
}

export interface SnapshotRepository {
  getLatest(documentId: string, templateId: string): Promise<SnapshotEnvelope | null>;
  getById(snapshotId: string): Promise<SnapshotEnvelope | null>;
  save(snapshot: SnapshotEnvelope): Promise<void>;
}

export interface CreateSnapshotInput {
  documentId: string;
  templateId: string;
  templateVersion?: number;
}

export interface ApplyOverrideInput {
  snapshotId: string;
  path: string;
  value: unknown;
  updatedBy?: string;
}
