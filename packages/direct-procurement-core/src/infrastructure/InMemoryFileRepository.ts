import type { DirectProcurementFile } from '../domain/file/DirectProcurementFile'
import type { FileRepository } from '../application/ports'

/** Test ve prototip için. Gerçek uygulamada SqliteFileRepository (DATA_TeminDosyasi vb.) yazılır. */
export class InMemoryFileRepository implements FileRepository {
  private readonly store = new Map<number, DirectProcurementFile>()
  async findById(id: number) { return this.store.get(id) }
  async save(file: DirectProcurementFile) { this.store.set(file.id, file) }
}
