import { AcceptanceLine } from "../../domain/file/AcceptanceRecord";
import { EventPublisher, FileRepository } from "../../domain/ports";
import { FileUseCase } from "./FileUseCase";

export class RecordAcceptanceUseCase extends FileUseCase<
  { fileId: number; date: string; lines: AcceptanceLine[] },
  number
> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  /** Oluşturulan tutanağın sıra numarasını döner. */
  async execute(
    c: { fileId: number; date: string; lines: AcceptanceLine[] },
  ): Promise<number> {
    const file = await this.load(c.fileId);
    const rec = file.recordAcceptance(c.lines, c.date);
    await this.commit(file);
    return rec.seqNo;
  }
}

export class ApproveAcceptanceUseCase
  extends FileUseCase<{ fileId: number; seqNo: number; at: string }> {
  constructor(repo: FileRepository, events: EventPublisher) {
    super(repo, events);
  }

  async execute(
    c: { fileId: number; seqNo: number; at: string },
  ): Promise<void> {
    const file = await this.load(c.fileId);
    file.approveAcceptance(c.seqNo, c.at);
    await this.commit(file);
  }
}
