import type {
  CreateSnapshotInput,
  SnapshotEnvelope,
  SnapshotRepository,
  TemplateDefinition
} from "../types.js";
import { MappingResolver } from "../mapping/mapping-resolver.js";
import { SnapshotMerger } from "./snapshot-merger.js";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class SnapshotBuilder {
  constructor(
    private readonly definitions: Map<string, TemplateDefinition>,
    private readonly resolver: MappingResolver,
    private readonly repository: SnapshotRepository,
    private readonly merger = new SnapshotMerger()
  ) {}

  async create(input: CreateSnapshotInput): Promise<SnapshotEnvelope> {
    const definition = this.getDefinition(input.templateId);
    const previous = await this.repository.getLatest(input.documentId, input.templateId);

    const freshData = await this.resolver.resolve(definition.mapping, {
      documentId: input.documentId,
      templateId: input.templateId
    });

    const merged = this.merger.merge(freshData, definition.mapping, previous);

    const snapshot: SnapshotEnvelope = {
      id: createId(),
      documentId: input.documentId,
      templateId: definition.templateId,
      templateVersion: input.templateVersion ?? definition.templateVersion,
      schemaVersion: definition.schemaVersion,
      revision: (previous?.revision ?? 0) + 1,
      createdAt: new Date().toISOString(),
      data: merged.data,
      overrides: merged.overrides
    };

    await this.repository.save(snapshot);
    return snapshot;
  }

  async applyOverride(input: {
    snapshotId: string;
    path: string;
    value: unknown;
    updatedBy?: string;
  }): Promise<SnapshotEnvelope> {
    const current = await this.repository.getById(input.snapshotId);
    if (!current) throw new Error(`Snapshot not found: ${input.snapshotId}`);

    const next: SnapshotEnvelope = {
      ...current,
      id: createId(),
      revision: current.revision + 1,
      createdAt: new Date().toISOString(),
      data: { ...current.data },
      overrides: {
        ...current.overrides,
        [input.path]: {
          value: input.value,
          updatedAt: new Date().toISOString(),
          updatedBy: input.updatedBy
        }
      }
    };

    // Override doğrudan data'ya da uygulanır; render her zaman tek data objesi kullanır.
    const { setPath } = await import("../utils/path.js");
    next.data = setPath(next.data, input.path, input.value);
    await this.repository.save(next);
    return next;
  }

  private getDefinition(templateId: string): TemplateDefinition {
    const definition = this.definitions.get(templateId);
    if (!definition) throw new Error(`Template definition not found: ${templateId}`);
    return definition;
  }
}
