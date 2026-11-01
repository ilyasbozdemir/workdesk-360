import type Database from 'better-sqlite3';
import type { SnapshotEnvelope, TemplateDefinition, ResolveContext } from '../core/types.js';
import { SnapshotEngine } from '../core/engine.js';

export class SqliteSnapshotRepository {
  constructor(private readonly db: Database.Database) {}
  latest<T = Record<string, unknown>>(documentId: string, templateId: string): SnapshotEnvelope<T> | undefined {
    const row = this.db.prepare('SELECT payload FROM document_snapshots WHERE document_id = ? AND template_id = ? ORDER BY revision DESC LIMIT 1')
      .get(documentId, templateId) as { payload: string } | undefined;
    return row ? JSON.parse(row.payload) as SnapshotEnvelope<T> : undefined;
  }
  save<T>(snapshot: SnapshotEnvelope<T>): void {
    const latest = this.latest(snapshot.documentId, snapshot.templateId);
    if (snapshot.revision !== (latest?.revision ?? 0) + 1) throw new Error('Snapshot revision conflict; reload latest revision');
    this.db.prepare('INSERT INTO document_snapshots (id, document_id, template_id, revision, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(snapshot.id, snapshot.documentId, snapshot.templateId, snapshot.revision, JSON.stringify(snapshot), snapshot.createdAt);
  }
  /** Atomically reads the latest snapshot, builds the next revision and persists it. */
  buildAndSave<T extends Record<string, unknown>>(
    engine: SnapshotEngine, definition: TemplateDefinition, context: ResolveContext,
    overrides: Record<string, unknown> = {}, clearOverrides: readonly string[] = []
  ): SnapshotEnvelope<T> {
    return this.db.transaction(() => {
      const previous = this.latest<T>(context.documentId, definition.id);
      const next = engine.build<T>(definition, context, previous, overrides, clearOverrides);
      this.save(next);
      return next;
    }).immediate();
  }
  history(documentId: string, templateId: string): SnapshotEnvelope[] {
    return (this.db.prepare('SELECT payload FROM document_snapshots WHERE document_id = ? AND template_id = ? ORDER BY revision')
      .all(documentId, templateId) as { payload: string }[]).map(row => JSON.parse(row.payload) as SnapshotEnvelope);
  }
}
