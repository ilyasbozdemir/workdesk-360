import { IRequest, IRequestHandler, RequestConstructor } from './types'

/**
 * MediatR benzeri merkezi In-Memory Mediator Bus.
 * UI/TSX katmanı doğrudan DB veya IPC çağırmak yerine,
 * Mediator üzerinden Command ve Query gönderir.
 */
class MediatorInstance {
  private handlers = new Map<string, IRequestHandler<any, any>>()

  /**
   * Bir Command veya Query için Handler kaydeder
   */
  public register<TRequest extends IRequest<TResponse>, TResponse>(
    requestType: RequestConstructor<TRequest> | string,
    handler: IRequestHandler<TRequest, TResponse>
  ): this {
    const key = typeof requestType === 'string' ? requestType : requestType.name
    if (this.handlers.has(key)) {
      console.warn(`[Mediator] '${key}' için mevcut handler eziliyor.`)
    }
    this.handlers.set(key, handler)
    return this
  }

  /**
   * Command veya Query'yi ilgili handler'a yönlendirir ve sonucu döner
   */
  public async send<TResponse>(request: IRequest<TResponse>): Promise<TResponse> {
    const key = request.constructor.name
    const handler = this.handlers.get(key)

    if (!handler) {
      throw new Error(`[Mediator] '${key}' isteği için kayıtlı bir Handler bulunamadı!`)
    }

    try {
      return await handler.handle(request)
    } catch (err: any) {
      console.error(`[Mediator] '${key}' işlenirken hata oluştu:`, err)
      throw err
    }
  }
}

// Global Singleton Mediator
export const mediator = new MediatorInstance()
