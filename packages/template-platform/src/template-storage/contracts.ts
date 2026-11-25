import type { TemplateMetadata } from "../shared/types.js";

export interface TemplateVersion<TDefinition> {
  metadata: TemplateMetadata;
  definition: TDefinition;
  publishedAt?: string;
}

export interface TemplateStorage<TDefinition> {
  saveDraft(metadata: TemplateMetadata, definition: TDefinition): Promise<void>;
  getVersion(id: string, version: number): Promise<TemplateVersion<TDefinition> | null>;
  publish(id: string, version: number): Promise<void>;
  listVersions(id: string): Promise<TemplateVersion<TDefinition>[]>;
}
