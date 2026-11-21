import { DirectProcurementFile } from "../../domain/file/DirectProcurementFile";
import type {
  EventPublisher,
  FileRepository,
  RateProvider,
} from "../../domain/ports";
import { DomainError } from "../../domain/shared/DomainError";

/** Ortak iskelet: yükle -> domain'e işlet -> kaydet -> olayları yayınla. */
export abstract class FileUseCase<TCommand, TResult = void> {
  protected constructor(
    protected readonly repo: FileRepository,
    protected readonly events: EventPublisher,
  ) {}

  abstract execute(command: TCommand): Promise<TResult>;

  protected async load(id: number): Promise<DirectProcurementFile> {
    const file = await this.repo.findById(id);
    if (!file) {
      throw new DomainError("FILE_NOT_FOUND", `Dosya bulunamadı: #${id}`);
    }
    return file;
  }

  protected async commit(file: DirectProcurementFile): Promise<void> {
    await this.repo.save(file);
    await this.events.publish(file.pullEvents());
  }
}
