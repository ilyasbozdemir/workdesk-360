import { LowestTotalStrategy, type WinnerResult, type WinnerSelectionStrategy } from '../../domain/winner/WinnerSelectionStrategy'
import { FileUseCase } from './FileUseCase'
import type { EventPublisher, FileRepository } from '../ports'

export class SelectWinnerUseCase extends FileUseCase<{ fileId: number; at: string }, WinnerResult> {
  constructor(
    repo: FileRepository,
    events: EventPublisher,
    private readonly strategy: WinnerSelectionStrategy = new LowestTotalStrategy(),
  ) { super(repo, events) }

  async execute(c: { fileId: number; at: string }): Promise<WinnerResult> {
    const file = await this.load(c.fileId)
    const result = file.selectWinner(this.strategy, c.at)
    await this.commit(file)
    return result
  }
}
