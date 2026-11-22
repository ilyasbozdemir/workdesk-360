import type {
  IDatabaseConnection,
  DatabaseExecutionResult,
  DatabaseQueryParameters,
  IDatabaseProvider,
  IDatabaseTransaction,
  PrismaDelegate
} from "@worksuite-360/core";

// Node.js 22.5+ yerleşik node:sqlite modülünü dinamik/güvenli içe aktar
let DatabaseSyncClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqlite = require("node:sqlite");
  DatabaseSyncClass = sqlite.DatabaseSync;
} catch {
  // Ortamda node:sqlite yoksa veya bundler engelliyorsa fallback devreye girer
}

let memoryDbInstance: any = null;

function createInMemoryFallback() {
  const table = new Map<string, { id: string; name: string; target_app: string; created_at: string }>([
    ['item-1', { id: 'item-1', name: 'John Doe', target_app: 'temin360-desktop', created_at: new Date().toISOString() }],
    ['item-2', { id: 'item-2', name: 'John Deere', target_app: 'temin360-desktop', created_at: new Date().toISOString() }],
    ['item-3', { id: 'item-3', name: 'Jane Roe', target_app: 'app-web', created_at: new Date().toISOString() }],
  ]);

  return {
    exec: (_sql: string) => {},
    prepare: (sql: string) => ({
      all: (...params: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.includes('is_alive')) {
          return [{ is_alive: 1, server_time: new Date().toISOString() }];
        }
        if (lower.includes('count(*)')) {
          return [{ toplam: table.size, target_app: 'temin360-desktop' }];
        }
        const items = Array.from(table.values());
        if (lower.includes('where id =') || lower.includes('where id=?')) {
          const id = params[0] || (sql.match(/id\s*=\s*['"]([^'"]+)['"]/i)?.[1]);
          return items.filter(x => x.id === id);
        }
        if (lower.includes('like')) {
          const rawMatch = sql.match(/like\s*['"]%([^%]+)%['"]/i)?.[1];
          const term = String(params[0] || rawMatch || '').toLowerCase();
          return items.filter(x => x.name.toLowerCase().includes(term));
        }
        return items;
      },
      run: (...params: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.startsWith('insert into')) {
          const id = params[0] || `item-${Date.now()}`;
          const name = params[1] || 'New Item';
          const target_app = params[2] || 'temin360-desktop';
          table.set(id, { id, name, target_app, created_at: new Date().toISOString() });
          return { changes: 1, lastInsertRowid: table.size };
        }
        if (lower.startsWith('update')) {
          const name = params[0];
          const id = params[1];
          const item = table.get(id);
          if (item) {
            item.name = name;
            return { changes: 1, lastInsertRowid: 0 };
          }
          return { changes: 0, lastInsertRowid: 0 };
        }
        if (lower.startsWith('delete from')) {
          if (lower.includes("like 'tx_%'")) {
            for (const key of Array.from(table.keys())) {
              if (key.startsWith('tx_')) table.delete(key);
            }
            return { changes: 1, lastInsertRowid: 0 };
          }
          const id = params[0] || (sql.match(/id\s*=\s*['"]([^'"]+)['"]/i)?.[1]);
          const deleted = id ? table.delete(id) : false;
          return { changes: deleted ? 1 : 0, lastInsertRowid: 0 };
        }
        return { changes: 1, lastInsertRowid: 0 };
      }
    }),
    close: () => table.clear()
  };
}

export function getPlaygroundRawDb() {
  if (!memoryDbInstance) {
    try {
      if (DatabaseSyncClass) {
        memoryDbInstance = new DatabaseSyncClass(":memory:");
        memoryDbInstance.exec(`
          CREATE TABLE IF NOT EXISTS playground_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_app TEXT DEFAULT 'temin360-desktop',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO playground_items (id, name, target_app) VALUES
            ('item-1', 'John Doe', 'temin360-desktop'),
            ('item-2', 'John Deere', 'temin360-desktop'),
            ('item-3', 'Jane Roe', 'app-web');
        `);
      } else {
        memoryDbInstance = createInMemoryFallback();
      }
    } catch {
      memoryDbInstance = createInMemoryFallback();
    }
  }
  return memoryDbInstance;
}

export function resetPlaygroundDb() {
  if (memoryDbInstance) {
    try {
      memoryDbInstance.close();
    } catch {}
    memoryDbInstance = null;
  }
}

/**
 * Concrete IDatabaseConnection for Playground.
 */
export function getPlaygroundConnection(): IDatabaseConnection {
  const db = getPlaygroundRawDb();

  return {
    async query<TResult = Record<string, unknown>>(
      sql: string,
      parameters?: DatabaseQueryParameters
    ): Promise<TResult[]> {
      const stmt = db.prepare(sql);
      const params = Array.isArray(parameters)
        ? parameters
        : parameters
        ? Object.values(parameters)
        : [];
      return stmt.all(...params) as TResult[];
    },

    async execute(
      sql: string,
      parameters?: DatabaseQueryParameters
    ): Promise<DatabaseExecutionResult> {
      const stmt = db.prepare(sql);
      const params = Array.isArray(parameters)
        ? parameters
        : parameters
        ? Object.values(parameters)
        : [];
      const res = stmt.run(...params);
      return {
        changes: Number(res.changes),
        lastInsertRowId: Number(res.lastInsertRowid ?? res.lastInsertRowId ?? 0),
      };
    },

    async close(): Promise<void> {
      resetPlaygroundDb();
    },
  };
}

/**
 * Concrete IDatabaseProvider for Playground.
 */
export class PlaygroundDatabaseProvider implements IDatabaseProvider {
  private _isOpen = false;

  async getConnection(): Promise<IDatabaseConnection> {
    this._isOpen = true;
    return getPlaygroundConnection();
  }

  async close(): Promise<void> {
    this._isOpen = false;
    resetPlaygroundDb();
  }

  get isOpen(): boolean {
    return this._isOpen;
  }
}

const defaultProvider = new PlaygroundDatabaseProvider();
export function getPlaygroundProvider(): IDatabaseProvider {
  return defaultProvider;
}

/**
 * Concrete IDatabaseTransaction for Playground.
 */
export class PlaygroundDatabaseTransaction implements IDatabaseTransaction {
  private _isActive = true;

  constructor(private readonly conn: IDatabaseConnection) {}

  get isActive(): boolean {
    return this._isActive;
  }

  async execute(sql: string, parameters?: unknown[]): Promise<void> {
    if (!this._isActive) {
      throw new Error("Transaction is not active.");
    }
    await this.conn.execute(sql, (parameters as any) || []);
  }

  async commit(): Promise<void> {
    if (!this._isActive) {
      throw new Error("Cannot commit an inactive transaction.");
    }
    this._isActive = false;
  }

  async rollback(): Promise<void> {
    if (!this._isActive) {
      throw new Error("Cannot rollback an inactive transaction.");
    }
    await this.conn.execute("DELETE FROM playground_items WHERE id LIKE 'tx_%'");
    this._isActive = false;
  }
}

/**
 * Concrete in-memory PrismaDelegate implementation for Playground.
 */
export class InMemoryPrismaDelegate<TEntity extends { id: any }, TId>
  implements PrismaDelegate<TEntity, TId>
{
  private store = new Map<any, TEntity>();

  constructor() {
    this.store.set('item-1' as any, { id: 'item-1', name: 'John Doe', target_app: 'temin360-desktop' } as unknown as TEntity);
    this.store.set('item-2' as any, { id: 'item-2', name: 'John Deere', target_app: 'temin360-desktop' } as unknown as TEntity);
  }

  async findUnique(args: {
    where: Record<string, unknown>;
  }): Promise<TEntity | null> {
    const targetId = args.where.id;
    return this.store.get(targetId) || null;
  }

  async findMany(): Promise<TEntity[]> {
    return Array.from(this.store.values());
  }

  async create(args: {
    data: Record<string, unknown>;
  }): Promise<TEntity> {
    const entity = { ...args.data } as TEntity;
    this.store.set(entity.id, entity);
    return entity;
  }

  async update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<TEntity> {
    const existing = this.store.get(args.where.id);
    if (!existing) {
      throw new Error(`Record with id ${args.where.id} not found.`);
    }
    const updated = { ...existing, ...args.data };
    this.store.set(args.where.id, updated);
    return updated;
  }

  async delete(args: {
    where: Record<string, unknown>;
  }): Promise<TEntity> {
    const existing = this.store.get(args.where.id);
    if (!existing) {
      throw new Error(`Record with id ${args.where.id} not found.`);
    }
    this.store.delete(args.where.id);
    return existing;
  }

  async count(args: {
    where: Record<string, unknown>;
  }): Promise<number> {
    if (!args.where.id) return this.store.size;
    return this.store.has(args.where.id) ? 1 : 0;
  }
}

const defaultPrismaDelegate = new InMemoryPrismaDelegate<{ id: string; name: string; target_app?: string }, string>();
export function getPlaygroundPrismaClient() {
  return {
    item: defaultPrismaDelegate
  };
}
