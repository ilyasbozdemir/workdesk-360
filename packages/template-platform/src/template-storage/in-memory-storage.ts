import type { TemplateStorage, TemplateVersion } from "./contracts.js";
import type { TemplateMetadata } from "../shared/types.js";

export class InMemoryTemplateStorage<TDefinition> implements TemplateStorage<TDefinition> {
  private readonly versions = new Map<string, TemplateVersion<TDefinition>>();

  async saveDraft(metadata: TemplateMetadata, definition: TDefinition) {
    this.versions.set(`${metadata.id}:${metadata.version}`, { metadata, definition });
  }

  async getVersion(id: string, version: number) {
    return this.versions.get(`${id}:${version}`) ?? null;
  }

  async publish(id: string, version: number) {
    const key = `${id}:${version}`;
    const current = this.versions.get(key);
    if (!current) throw new Error(`Template version not found: ${key}`);
    current.metadata.status = "published";
    current.publishedAt = new Date().toISOString();
  }

  async listVersions(id: string) {
    return [...this.versions.values()]
      .filter((item) => item.metadata.id === id)
      .sort((a, b) => a.metadata.version - b.metadata.version);
  }
}
