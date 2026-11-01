import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { SnapshotEngine } from '../src/core/engine.js';
import { SqliteSnapshotRepository } from '../src/sqlite/repository.js';
import type { TemplateDefinition } from '../src/core/types.js';

const definition: TemplateDefinition = {
  id: 'test', version: 2, schemaVersion: 1,
  fields: [{ path: 'document.title', placeholder: '{{document.title}}', mapping: { kind: 'static', value: 'Hello' }, refreshPolicy: 'preserve', valueType: 'string' }],
  form: []
};
const engine = new SnapshotEngine({ resolve: mapping => mapping.kind === 'static' ? mapping.value : null });
const context = { globalId: 'g1', documentId: 'd1' };

test('rejects snapshots belonging to another document, template or schema', () => {
  const first = engine.build(definition, context);
  assert.throws(() => engine.build(definition, { ...context, documentId: 'd2' }, first), /documentId mismatch/);
  assert.throws(() => engine.build({ ...definition, id: 'other' }, context, first), /templateId mismatch/);
  assert.throws(() => engine.build({ ...definition, schemaVersion: 2 }, context, first), /schemaVersion mismatch/);
  assert.throws(() => engine.build({ ...definition, version: 1 }, context, first), /newer than definition/);
});

test('rejects null objects and invalid collection column types', () => {
  const objectField: TemplateDefinition = { ...definition, fields: [{ ...definition.fields[0], mapping: { kind: 'static', value: null }, valueType: 'object' }] };
  const required = { ...objectField, fields: [{ ...objectField.fields[0], required: true }] };
  assert.throws(() => engine.build(required, context), /Required/);
  const rows: TemplateDefinition = { ...definition, fields: [{ path: 'document.rows', placeholder: '{{document.rows}}', refreshPolicy: 'source', valueType: 'array', mapping: { kind: 'collection', table: 'items', whereColumn: 'document_id', scopeId: 'documentId', fields: { amount: 'miktar' } }, collectionFieldTypes: { amount: 'number' } }] };
  const bad = new SnapshotEngine({ resolve: () => [{ amount: 'invalid' }] });
  assert.throws(() => bad.build(rows, context), /Invalid collection field/);
  assert.throws(() => new SnapshotEngine({ resolve: () => [{}] }).build(rows, context), /Missing collection field/);
});

test('atomic buildAndSave creates ordered revisions and rolls back failures', () => {
  const db = new Database(':memory:');
  try {
    db.exec('CREATE TABLE document_snapshots (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, template_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(document_id,template_id,revision))');
    const repo = new SqliteSnapshotRepository(db);
    const first = repo.buildAndSave(engine, definition, context);
    const second = repo.buildAndSave(engine, definition, context);
    assert.equal(first.revision, 1);
    assert.equal(second.revision, 2);
    assert.equal(repo.history('d1', 'test').length, 2);
    assert.throws(() => repo.save(first), /revision conflict/);
    assert.throws(() => repo.buildAndSave(engine, { ...definition, schemaVersion: 2 }, context), /schemaVersion mismatch/);
    assert.equal(repo.history('d1', 'test').length, 2);
  } finally { db.close(); }
});
