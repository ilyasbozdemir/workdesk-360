/**
 * WorkDesk 360 Common modülü.
 *
 * Uygulama genelinde kullanılan ortak tipleri,
 * sonuç yapılarını ve hata sınıflarını dışa aktarır.
 *
 * Kullanım:
 *
 * import {
 *   Result,
 *   success,
 *   failure,
 *   AppError,
 *   ValidationError,
 *   NotFoundError,
 *   ConflictError,
 *   EntityId,
 *   PaginationParams,
 * } from "@worksuite-360/core/common";
 */

// Types
export {
  type Failure,
  failure,
  isFailure,
  isSuccess,
  type Result,
  type Success,
  success,
} from "./types/Result";

export {
  createEntityId,
  type EntityId,
  type EntityIdOf,
  entityIdToString,
  isValidEntityId,
} from "./types/EntityId";

export {
  createPaginationMeta,
  DEFAULT_PAGINATION,
  type PaginatedResult,
  type PaginationMeta,
  type PaginationParams,
  type QueryParams,
  type SortDirection,
  type SortOption,
} from "./types/Pagination";

// Errors
export { AppError, type AppErrorOptions } from "./errors/AppError";

export {
  ValidationError,
  type ValidationIssue,
} from "./errors/ValidationError";

export {
  NotFoundError,
  type NotFoundErrorOptions,
} from "./errors/NotFoundError";

export {
  ConflictError,
  type ConflictErrorOptions,
} from "./errors/ConflictError";
