import { describe, it, expect } from 'vitest'
import { mediator } from '../mediator'
import { BaseQuery, BaseCommand, IRequestHandler } from '../types'

// Test Query & Command
class TestGetGreetingQuery extends BaseQuery<string> {
  constructor(public readonly name: string) {
    super()
  }
}

class TestGetGreetingQueryHandler implements IRequestHandler<TestGetGreetingQuery, string> {
  async handle(query: TestGetGreetingQuery): Promise<string> {
    return `Merhaba, ${query.name}!`
  }
}

class TestCalculateTotalCommand extends BaseCommand<number> {
  constructor(
    public readonly a: number,
    public readonly b: number
  ) {
    super()
  }
}

class TestCalculateTotalCommandHandler implements IRequestHandler<
  TestCalculateTotalCommand,
  number
> {
  async handle(command: TestCalculateTotalCommand): Promise<number> {
    return command.a + command.b
  }
}

describe('CQRS & Mediator Pattern', () => {
  it('Query kaydedilip mediator.send ile doğru yanıt dönmeli', async () => {
    mediator.register(TestGetGreetingQuery, new TestGetGreetingQueryHandler())
    const res = await mediator.send(new TestGetGreetingQuery('TEMİN 360'))
    expect(res).toBe('Merhaba, TEMİN 360!')
  })

  it('Command kaydedilip mediator.send ile doğru yanıt dönmeli', async () => {
    mediator.register(TestCalculateTotalCommand, new TestCalculateTotalCommandHandler())
    const total = await mediator.send(new TestCalculateTotalCommand(150, 250))
    expect(total).toBe(400)
  })

  it('Kayıtsız bir Request gönderildiğinde açıklayıcı hata fırlatmalı', async () => {
    class UnregisteredRequest extends BaseQuery<void> {}
    await expect(mediator.send(new UnregisteredRequest())).rejects.toThrow(
      "UnregisteredRequest' isteği için kayıtlı bir Handler bulunamadı"
    )
  })
})
