/**
 * CQRS & Mediator Core Interfaces
 * MediatR benzeri Command, Query ve Request sözleşmeleri
 */

// Temel Request işareti
export interface IRequest<TResponse = void> {
  readonly _responseType?: TResponse
}

export abstract class BaseRequest<TResponse = void> implements IRequest<TResponse> {
  readonly _responseType?: TResponse
}

// CQRS: State değiştirmeyen okuma istekleri (Query) için taban sınıf
export abstract class BaseQuery<TResponse> extends BaseRequest<TResponse> {
  readonly __isQuery = true
}

// CQRS: State değiştiren yazma/güncelleme istekleri (Command) için taban sınıf
export abstract class BaseCommand<TResponse = void> extends BaseRequest<TResponse> {
  readonly __isCommand = true
}

export type IQuery<TResponse> = BaseQuery<TResponse>
export type ICommand<TResponse = void> = BaseCommand<TResponse>

// Request Handler Arayüzü
export interface IRequestHandler<TRequest extends IRequest<TResponse>, TResponse = void> {
  handle(request: TRequest): Promise<TResponse>
}

// Request Constructor Tipi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestConstructor<TRequest extends IRequest<any>> = new (...args: any[]) => TRequest
