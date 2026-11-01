import assert from "node:assert/strict";
import test from "node:test";
import { SnapshotEngine } from "../src/core/engine.js";
import type { DataSource, Mapping, ResolveContext, TemplateDefinition } from "../src/core/types.js";

const context: ResolveContext = { globalId: "global-1", documentId: "document-1" };

function createDefinition(): TemplateDefinition {
  return {
    id: "test-template",
    version: 1,
    schemaVersion: 1,
    fields: [
      {
        path: "document.title",
        placeholder: "{{document.title}}",
        mapping: { kind: "static", value: "Source title" },
        refreshPolicy: "source",
        valueType: "string",
        required: true
      },
      {
        path: "document.note",
        placeholder: "{{document.note}}",
        mapping: { kind: "static", value: "Initial note" },
        refreshPolicy: "manual",
        valueType: "string",
        editable: true
      },
      {
        path: "document.rows",
        placeholder: "{{document.rows}}",
        mapping: {
          kind: "collection",
          table: "rows",
          whereColumn: "document_id",
          scopeId: "documentId",
          fields: {}
        },
        refreshPolicy: "source",
        valueType: "array"
      }
    ],
    form: []
  };
}

function createSource(resolve: (mapping: Mapping, context: ResolveContext) => unknown): DataSource {
  return { resolve: (mapping, sourceContext) => resolve(mapping, sourceContext) };
}

test("clearing an override restores the field's source value in the next revision", () => {
  const engine = new SnapshotEngine(createSource(mapping =>
    mapping.kind === "collection" ? [] : mapping.kind === "static" ? mapping.value : null
  ));
  const definition = createDefinition();
  const first = engine.build(definition, context, undefined, { "document.note": "Edited note" });
  const next = engine.build(definition, context, first, {}, ["document.note"]);

  assert.equal(next.data.document.note, "Initial note");
  assert.deepEqual(next.overrides, {});
  assert.equal(next.revision, 2);
});

test("required fields reject empty values", () => {
  const engine = new SnapshotEngine(createSource(mapping =>
    mapping.kind === "static" && mapping.value === "Source title" ? "" : mapping.kind === "static" ? mapping.value : mapping.kind === "collection" ? [] : null
  ));

  assert.throws(() => engine.build(createDefinition(), context), /Required: document\.title/);
});

test("field value types are validated at runtime", () => {
  const engine = new SnapshotEngine(createSource(mapping =>
    mapping.kind === "static" && mapping.value === "Source title" ? 42 : mapping.kind === "static" ? mapping.value : mapping.kind === "collection" ? [] : null
  ));

  assert.throws(() => engine.build(createDefinition(), context), /Invalid string value: document\.title/);
});

test("collection mappings reject non-object rows", () => {
  const engine = new SnapshotEngine(createSource(mapping =>
    mapping.kind === "static" && mapping.value === "Source title"
      ? "Source title"
      : mapping.kind === "collection"
        ? ["not a row object"]
        : mapping.kind === "static" ? mapping.value : null
  ));

  assert.throws(() => engine.build(createDefinition(), context), /Invalid collection value: document\.rows/);
});

test("override clearing is limited to editable fields", () => {
  const engine = new SnapshotEngine(createSource(mapping =>
    mapping.kind === "collection" ? [] : mapping.kind === "static" ? mapping.value : null
  ));

  assert.throws(() => engine.build(createDefinition(), context, undefined, {}, ["document.title"]), /Override not allowed: document\.title/);
});
