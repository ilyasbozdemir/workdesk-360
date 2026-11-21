import { FileUseCase } from "./FileUseCase";
import type { EventPublisher, FileRepository } from "../../domain/ports";

export class ApproveResultUseCase
  extends FileUseCase<{ fileId: number; at: string }> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  async execute(c: { fileId: number; at: string }): Promise<void> {
    const file = await this.load(c.fileId);
    file.approveResult(c.at);
    await this.commit(file);
  }
}
