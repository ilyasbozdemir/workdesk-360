import type { DirectProcurementFile } from '../domain/file/DirectProcurementFile'
import type { FileRepository } from '../application/ports'

/**
 * DirectProcurementFile aggregate nesnelerini bellek içinde (Map üzerinde) saklayan depo adaptörü.
 *
 * Test senaryoları, prototipler veya SQLite gerektirmeyen hafif test ortamları için kullanılır.
 */
export class InMemoryFileRepository implements FileRepository {
  private readonly store = new Map<number, DirectProcurementFile>()

  /**
   * Dosya ID'sine göre bellekten aggregate örneğini getirir.
   * @param id - Dosya ID numarası.
   */
  async findById(id: number): Promise<DirectProcurementFile | undefined> {
    return this.store.get(id)
  }

  /**
   * Dosya aggregate'ini bellekte saklar.
   * @param file - Saklanacak dosya örneği.
   */
  async save(file: DirectProcurementFile): Promise<void> {
    this.store.set(file.id, file)
  }
}
