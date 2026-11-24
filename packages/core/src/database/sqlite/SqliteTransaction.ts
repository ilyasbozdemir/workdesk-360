import type { IDatabaseConnection } from "../contracts/IDatabaseConnection";
import type { IDatabaseTransaction } from "../contracts/IDatabaseTransaction";
import { AppError } from "../../common/errors/AppError";

/**
 * SQLite Savepoint tabanlı ACID uyumlu Transaction yöneticisi.
 *
 * IDatabaseTransaction sözleşmesini uygular.
 * SQLite SAVEPOINT mekanizması sayesinde hem tekil hem de iç içe (nested)
 * transaction'ları güvenle yönetir.
 */
export class SqliteTransaction implements IDatabaseTransaction {
  private _isActive = false;
  private _isCommitted = false;
  private _isRolledBack = false;
  private readonly savepointName: string;

  private constructor(
    private readonly connection: IDatabaseConnection,
    savepointName?: string,
  ) {
    this.savepointName =
      savepointName ??
      `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Yeni bir transaction başlatır ve savepoint oluşturur.
   */
  public static async begin(
    connection: IDatabaseConnection,
    savepointName?: string,
  ): Promise<SqliteTransaction> {
    const tx = new SqliteTransaction(connection, savepointName);
    await tx.start();
    return tx;
  }

  private async start(): Promise<void> {
    await this.connection.execute(`SAVEPOINT ${this.savepointName}`);
    this._isActive = true;
  }

  /**
   * Transaction dahilinde SQL komutu çalıştırır.
   */
  public async execute(sql: string, parameters?: unknown[]): Promise<void> {
    if (!this._isActive) {
      throw new AppError({
        code: "TRANSACTION_INACTIVE",
        message: "Cannot execute statement: transaction is no longer active.",
      });
    }

    try {
      await this.connection.execute(sql, parameters);
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError({
            code: "TRANSACTION_EXECUTION_ERROR",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          });
    }
  }

  /**
   * Transaction'ı onaylar ve değişiklikleri kalıcı hale getirir.
   */
  public async commit(): Promise<void> {
    if (!this._isActive) {
      if (this._isCommitted) {
        throw new AppError({
          code: "TRANSACTION_ALREADY_COMMITTED",
          message: "Cannot commit: transaction has already been committed.",
        });
      }
      if (this._isRolledBack) {
        throw new AppError({
          code: "TRANSACTION_ALREADY_ROLLED_BACK",
          message: "Cannot commit: transaction has already been rolled back.",
        });
      }
      throw new AppError({
        code: "TRANSACTION_INACTIVE",
        message: "Cannot commit: transaction is inactive.",
      });
    }

    await this.connection.execute(`RELEASE SAVEPOINT ${this.savepointName}`);
    this._isActive = false;
    this._isCommitted = true;
  }

  /**
   * Transaction'ı geri alır ve veritabanı durumunu transaction öncesine döndürür.
   */
  public async rollback(): Promise<void> {
    if (!this._isActive) {
      if (this._isRolledBack) {
        throw new AppError({
          code: "TRANSACTION_ALREADY_ROLLED_BACK",
          message: "Cannot rollback: transaction has already been rolled back.",
        });
      }
      if (this._isCommitted) {
        throw new AppError({
          code: "TRANSACTION_ALREADY_COMMITTED",
          message: "Cannot rollback: transaction has already been committed.",
        });
      }
      throw new AppError({
        code: "TRANSACTION_INACTIVE",
        message: "Cannot rollback: transaction is inactive.",
      });
    }

    try {
      await this.connection.execute(`ROLLBACK TO SAVEPOINT ${this.savepointName}`);
      await this.connection.execute(`RELEASE SAVEPOINT ${this.savepointName}`);
    } finally {
      this._isActive = false;
      this._isRolledBack = true;
    }
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get isCommitted(): boolean {
    return this._isCommitted;
  }

  public get isRolledBack(): boolean {
    return this._isRolledBack;
  }
}
