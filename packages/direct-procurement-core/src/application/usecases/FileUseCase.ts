import { DirectProcurementFile } from "../../domain/file/DirectProcurementFile";
import type {
  EventPublisher,
  FileRepository,
  RateProvider,
} from "../ports";
import { DomainError } from "../../domain/shared/DomainError";

/**
 * Doğrudan temin dosyası üzerinde çalışan komut işlemlerinin soyut temel sınıfı.
 *
 * İşlem döngüsü:
 * 1. Dosyayı depodan yükler (`load`),
 * 2. Domain mantığını veya aggregate metotlarını çalıştırır,
 * 3. Değişen aggregate'i kaydeder (`commit`),
 * 4. Biriken etki alanı olaylarını (Domain Events) yayınlar.
 *
 * @template TCommand - Use-case'e iletilen parametre ve komut tipi.
 * @template TResult - İşlem sonucunda döndürülen veri tipi (varsayılan: void).
 */
export abstract class FileUseCase<TCommand, TResult = void> {
  /**
   * @param repo - Dosya verilerinin yüklenip kaydedileceği depo portu.
   * @param events - Etki alanı olaylarının iletileceği yayıncı portu.
   */
  protected constructor(
    protected readonly repo: FileRepository,
    protected readonly events: EventPublisher,
  ) {}

  /**
   * Komutu çalıştırır.
   * @param command - Yürütülecek işlem parametreleri.
   */
  abstract execute(command: TCommand): Promise<TResult>;

  /**
   * Belirtilen ID'ye sahip doğrudan temin dosyasını depodan yükler.
   * @param id - Dosya ID numarası.
   * @returns Yüklenen aggregate root örneği.
   * @throws {DomainError} Dosya bulunamazsa `FILE_NOT_FOUND` koduyla fırlatılır.
   */
  protected async load(id: number): Promise<DirectProcurementFile> {
    const file = await this.repo.findById(id);
    if (!file) {
      throw new DomainError("FILE_NOT_FOUND", `Dosya bulunamadı: #${id}`);
    }
    return file;
  }

  /**
   * Aggregate durumunu depoya kaydeder ve birikmiş olayları yayınlar.
   * @param file - Kaydedilecek dosya nesnesi.
   */
  protected async commit(file: DirectProcurementFile): Promise<void> {
    await this.repo.save(file);
    await this.events.publish(file.pullEvents());
  }
}
