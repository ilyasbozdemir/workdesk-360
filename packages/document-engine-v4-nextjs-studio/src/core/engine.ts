import { randomUUID } from "node:crypto";
import { getAt, hasOwnPath, setAt } from "./path.js";
import type { DataSource, FieldDefinition, ResolveContext, SnapshotEnvelope, TemplateDefinition } from "./types.js";

import { validateValue } from "./validation.js";

export class SnapshotEngine {
  constructor(private readonly source: DataSource) {}
  build<T extends Record<string, unknown>>(
    definition: TemplateDefinition,
    context: ResolveContext,
    previous?: SnapshotEnvelope<T>,
    overrides: Record<string, unknown> = {},
    clearOverrides: readonly string[] = []
  ): SnapshotEnvelope<T> {
    if (previous) {
      if (previous.documentId !== context.documentId) throw new Error('Previous snapshot documentId mismatch');
      if (previous.templateId !== definition.id) throw new Error('Previous snapshot templateId mismatch');
      if (previous.schemaVersion !== definition.schemaVersion) throw new Error('Previous snapshot schemaVersion mismatch; migrate snapshot before rebuilding');
      if (previous.templateVersion > definition.version) throw new Error('Previous snapshot templateVersion is newer than definition');
      if (!Number.isSafeInteger(previous.revision) || previous.revision < 1) throw new Error('Invalid previous snapshot revision');
    }
    const data: Record<string, unknown> = {};
    const effectiveOverrides = { ...(previous?.overrides ?? {}), ...overrides };
    const allowed = new Set<string>(definition.fields.filter(f => f.editable).map(f => f.path));
    for (const path of clearOverrides) {
      if (!allowed.has(path)) throw new Error(`Override not allowed: ${path}`);
      delete effectiveOverrides[path];
    }
    for (const path of Object.keys(effectiveOverrides)) if (!allowed.has(path)) throw new Error(`Override not allowed: ${path}`);
    const byPath = new Map<string, FieldDefinition>();
    for (const field of definition.fields) {
      if (byPath.has(field.path)) throw new Error(`Duplicate field path: ${field.path}`);
      byPath.set(field.path, field);
    }
    const visiting = new Set<string>();
    const resolved = new Set<string>();
    const resolveField = (field: FieldDefinition): void => {
      if (resolved.has(field.path)) return;
      if (visiting.has(field.path)) throw new Error(`Computed dependency cycle: ${field.path}`);
      visiting.add(field.path);
      const mapping = field.mapping;
      if (mapping.kind === "computed") {
        const dependency = byPath.get(mapping.sourcePath);
        if (!dependency) throw new Error(`Unknown computed dependency: ${mapping.sourcePath}`);
        resolveField(dependency);
      }
      const oldExists = !!previous && hasOwnPath(previous.data, field.path);
      const hasOverride = Object.prototype.hasOwnProperty.call(effectiveOverrides, field.path);
      let value: unknown;
      if (field.refreshPolicy === "preserve" && oldExists) value = getAt(previous!.data, field.path);
      else if (field.refreshPolicy === "manual" && hasOverride) value = effectiveOverrides[field.path];
      else if (mapping.kind === "computed") {
        const rows = getAt(data, mapping.sourcePath);
        if (!Array.isArray(rows)) throw new Error(`Computed source must be an array: ${mapping.sourcePath}`);
        if (mapping.operation === "count") value = rows.length;
        else {
          if (!mapping.valueField) throw new Error(`Computed sum requires valueField: ${field.path}`);
          value = rows.reduce<number>((total, row, index) => {
            if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`Invalid computed row ${index}`);
            const record = row as Record<string, unknown>;
            const a = record[mapping.valueField!];
            const b = mapping.multiplyField ? record[mapping.multiplyField] : 1;
            if (typeof a !== "number" || !Number.isFinite(a) || typeof b !== "number" || !Number.isFinite(b)) throw new Error(`Invalid computed number at row ${index}: ${field.path}`);
            const result = total + a * b;
            if (!Number.isFinite(result)) throw new Error(`Computed overflow: ${field.path}`);
            return result;
          }, 0);
        }
      } else value = this.source.resolve(mapping, context);
      if (field.refreshPolicy !== "manual" && hasOverride) value = effectiveOverrides[field.path];
      validateValue(field, value);
      setAt(data, field.path, value ?? null);
      visiting.delete(field.path);
      resolved.add(field.path);
    };
    for (const field of definition.fields) resolveField(field);
    return { id: randomUUID(), templateId: definition.id, templateVersion: definition.version, schemaVersion: definition.schemaVersion,
      documentId: context.documentId, revision: (previous?.revision ?? 0) + 1, createdAt: new Date().toISOString(),
      data: data as T, overrides: effectiveOverrides };
  }
}
