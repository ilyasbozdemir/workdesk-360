import type { SnapshotEnvelope, SnapshotRepository } from "../types.js";

/** Demo/test repository. Üretimde SQLite adapter ile değiştirin. */
export class InMemorySnapshotRepository implements SnapshotRepository {
  private readonly snapshots = new Map<string, SnapshotEnvelope>();

  async getLatest(documentId: string, templateId: string): Promise<SnapshotEnvelope | null> {
    const found = [...this.snapshots.values()]
      .filter(x => x.documentId === documentId && x.templateId === templateId)
      .sort((a, b) => b.revision - a.revision)[0];
    return found ? structuredClone(found) : null;
  }

  async getById(snapshotId: string): Promise<SnapshotEnvelope | null> {
    const found = this.snapshots.get(snapshotId);
    return found ? structuredClone(found) : null;
  }

  async save(snapshot: SnapshotEnvelope): Promise<void> {
    this.snapshots.set(snapshot.id, structuredClone(snapshot));
  }
}
