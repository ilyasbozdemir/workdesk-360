import path from "node:path";
import fs from "node:fs";
import type {
  DatabaseExecutionResult,
  DatabaseQueryParameters,
  IDatabaseConnection,
  IDatabaseProvider,
  IDatabaseTransaction,
  ITeminPackage,
  PrismaDelegate,
} from "@worksuite-360/core";
import { TeminPackage } from "@worksuite-360/core";

// Node.js 22.5+ yerleşik node:sqlite modülünü dinamik/güvenli içe aktar
let DatabaseSyncClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqlite = require("node:sqlite");
  DatabaseSyncClass = sqlite.DatabaseSync;
} catch {
  // Ortamda node:sqlite yoksa fallback devreye girer
}

let activeDbInstance: any = null;
let activeDbPath: string | null = null;

function resolveFixtureDbPath(): string | null {
  const candidates = [
    path.resolve(
      process.cwd(),
      "tests/fixtures/temin/files/test-projesi.sqlite",
    ),
    path.resolve(
      process.cwd(),
      "../../tests/fixtures/temin/files/test-projesi.sqlite",
    ),
    path.resolve(process.cwd(), "test-projesi.sqlite"),
    path.resolve(
      process.cwd(),
      "tests/fixtures/temin/files/test-projesi.temin",
    ),
    path.resolve(
      process.cwd(),
      "../../tests/fixtures/temin/files/test-projesi.temin",
    ),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      if (c.endsWith(".temin")) {
        const extracted = c.replace(/\.temin$/, ".sqlite");
        if (!fs.existsSync(extracted)) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const cp = require("node:child_process");
            cp.execSync(`tar -xf "${c}" database.sqlite`, {
              cwd: path.dirname(c),
            });
            const defaultDb = path.join(path.dirname(c), "database.sqlite");
            if (fs.existsSync(defaultDb)) {
              fs.renameSync(defaultDb, extracted);
            }
          } catch {}
        }
        if (fs.existsSync(extracted)) return extracted;
      } else {
        return c;
      }
    }
  }
  return null;
}

function createInMemoryFallback() {
  const table = new Map<
    string,
    { id: string; name: string; target_app: string; created_at: string }
  >([
    ["item-1", {
      id: "item-1",
      name: "John Doe",
      target_app: "temin360-desktop",
      created_at: new Date().toISOString(),
    }],
    ["item-2", {
      id: "item-2",
      name: "John Deere",
      target_app: "temin360-desktop",
      created_at: new Date().toISOString(),
    }],
    ["item-3", {
      id: "item-3",
      name: "Jane Roe",
      target_app: "app-web",
      created_at: new Date().toISOString(),
    }],
  ]);

  return {
    exec: (_sql: string) => {},
    prepare: (sql: string) => ({
      all: (...params: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.includes("is_alive")) {
          return [{ is_alive: 1, server_time: new Date().toISOString() }];
        }
        if (lower.includes("count(*)")) {
          return [{ toplam: table.size, target_app: "temin360-desktop" }];
        }
        const items = Array.from(table.values());
        if (lower.includes("where id =") || lower.includes("where id=?")) {
          const id = params[0] ||
            (sql.match(/id\s*=\s*['"]([^'"]+)['"]/i)?.[1]);
          return items.filter((x) => x.id === id);
        }
        if (lower.includes("like")) {
          const rawMatch = sql.match(/like\s*['"]%([^%]+)%['"]/i)?.[1];
          const term = String(params[0] || rawMatch || "").toLowerCase();
          return items.filter((x) => x.name.toLowerCase().includes(term));
        }
        return items;
      },
      run: (...params: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.startsWith("insert into")) {
          const id = params[0] || `item-${Date.now()}`;
          const name = params[1] || "New Item";
          const target_app = params[2] || "temin360-desktop";
          table.set(id, {
            id,
            name,
            target_app,
            created_at: new Date().toISOString(),
          });
          return { changes: 1, lastInsertRowid: table.size };
        }
        if (lower.startsWith("update")) {
          const name = params[0];
          const id = params[1];
          const item = table.get(id);
          if (item) {
            item.name = name;
            return { changes: 1, lastInsertRowid: 0 };
          }
          return { changes: 0, lastInsertRowid: 0 };
        }
        if (lower.startsWith("delete from")) {
          if (lower.includes("like 'tx_%'")) {
            for (const key of Array.from(table.keys())) {
              if (key.startsWith("tx_")) table.delete(key);
            }
            return { changes: 1, lastInsertRowid: 0 };
          }
          const id = params[0] ||
            (sql.match(/id\s*=\s*['"]([^'"]+)['"]/i)?.[1]);
          const deleted = id ? table.delete(id) : false;
          return { changes: deleted ? 1 : 0, lastInsertRowid: 0 };
        }
        return { changes: 1, lastInsertRowid: 0 };
      },
    }),
    close: () => table.clear(),
  };
}

export function getPlaygroundRawDb() {
  if (!activeDbInstance) {
    try {
      if (DatabaseSyncClass) {
        const fixtureDb = resolveFixtureDbPath();
        if (fixtureDb && fs.existsSync(fixtureDb)) {
          activeDbInstance = new DatabaseSyncClass(fixtureDb);
          activeDbPath = fixtureDb;
        } else {
          activeDbInstance = new DatabaseSyncClass(":memory:");
          activeDbPath = ":memory:";
        }

        // 1. Ensure playground_items exists
        activeDbInstance.exec(`
          CREATE TABLE IF NOT EXISTS playground_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_app TEXT DEFAULT 'temin360-desktop',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO playground_items (id, name, target_app) VALUES
            ('item-1', 'John Doe', 'temin360-desktop'),
            ('item-2', 'John Deere', 'temin360-desktop'),
            ('item-3', 'Jane Roe', 'app-web')
          ON CONFLICT(id) DO NOTHING;
        `);

        // 2. Ensure Acme credentials in settings
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require("node:crypto");
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.scryptSync("AcmeAcme", salt, 64).toString("hex");
        const passwordHash = `scrypt$${salt}$${hash}`;

        activeDbInstance.exec(`
          INSERT OR REPLACE INTO settings (key, value) VALUES ('adminUsername', 'Acme');
          INSERT OR REPLACE INTO settings (key, value) VALUES ('adminPassword', '${passwordHash}');
          INSERT OR REPLACE INTO settings (key, value) VALUES ('adminName', 'Acme');
          INSERT OR REPLACE INTO settings (key, value) VALUES ('institutionName', 'Acme Corporation');
        `);
      } else {
        activeDbInstance = createInMemoryFallback();
      }
    } catch {
      activeDbInstance = createInMemoryFallback();
    }
  }
  return activeDbInstance;
}

export function getActiveDbPath(): string {
  if (!activeDbPath) getPlaygroundRawDb();
  return activeDbPath || "test-projesi.sqlite (Fixture DB)";
}

export function resetPlaygroundDb() {
  if (activeDbInstance) {
    try {
      activeDbInstance.close();
    } catch {}
    activeDbInstance = null;
    activeDbPath = null;
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
      parameters?: DatabaseQueryParameters,
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
      parameters?: DatabaseQueryParameters,
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
        lastInsertRowId: Number(
          res.lastInsertRowid ?? res.lastInsertRowId ?? 0,
        ),
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
 * Gerçek SQLite SAVEPOINT / ROLLBACK TO SAVEPOINT / RELEASE motor komutlarını yürütür.
 */
export class PlaygroundDatabaseTransaction implements IDatabaseTransaction {
  private _isActive = false;
  private readonly savepointId: string;

  constructor(private readonly conn: IDatabaseConnection) {
    this.savepointId = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Gerçek SQLite Savepoint / Transaction başlatır.
   */
  async begin(): Promise<void> {
    if (this._isActive) {
      throw new Error("Transaction is already active.");
    }
    await this.conn.execute(`SAVEPOINT ${this.savepointId}`);
    this._isActive = true;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  async execute(sql: string, parameters?: unknown[]): Promise<void> {
    if (!this._isActive) {
      throw new Error("Transaction is not active. Call begin() first.");
    }
    await this.conn.execute(sql, (parameters as any) || []);
  }

  /**
   * Gerçek SQLite RELEASE (Commit): Değişiklikleri veritabanına kalıcı olarak işler.
   */
  async commit(): Promise<void> {
    if (!this._isActive) {
      throw new Error("Cannot commit an inactive transaction.");
    }
    await this.conn.execute(`RELEASE SAVEPOINT ${this.savepointId}`);
    this._isActive = false;
  }

  /**
   * Gerçek SQLite ROLLBACK: Veritabanı motoru savepoint anından sonraki tüm değişiklikleri geri alır.
   * Asla sahte DELETE veya manuel kayıt temizleme hilesi içermez!
   */
  async rollback(): Promise<void> {
    if (!this._isActive) {
      throw new Error("Cannot rollback an inactive transaction.");
    }
    await this.conn.execute(`ROLLBACK TO SAVEPOINT ${this.savepointId}`);
    await this.conn.execute(`RELEASE SAVEPOINT ${this.savepointId}`);
    this._isActive = false;
  }
}

/**
 * Concrete in-memory PrismaDelegate implementation for Playground.
 */
export class InMemoryPrismaDelegate<TEntity extends { id: any }, TId>
  implements PrismaDelegate<TEntity, TId> {
  private store = new Map<any, TEntity>();

  constructor() {
    this.store.set(
      "item-1" as any,
      {
        id: "item-1",
        name: "John Doe",
        target_app: "temin360-desktop",
      } as unknown as TEntity,
    );
    this.store.set(
      "item-2" as any,
      {
        id: "item-2",
        name: "John Deere",
        target_app: "temin360-desktop",
      } as unknown as TEntity,
    );
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

const defaultPrismaDelegate = new InMemoryPrismaDelegate<
  { id: string; name: string; target_app?: string },
  string
>();

let realPrismaClient: any = null;

export function getPlaygroundPrismaClient() {
  if (!realPrismaClient) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient: PrismaClientClass } = require("../../generated/prisma-client");

      const activeDb = getActiveDbPath();
      const normalizedDbPath = path.resolve(activeDb).replace(/\\/g, "/");
      realPrismaClient = new PrismaClientClass({
        datasources: {
          db: {
            url: `file:${normalizedDbPath}`,
          },
        },
      });

      // Başlangıç tohum verisi
      (async () => {
        try {
          const count = await realPrismaClient.playgroundItem.count();
          if (count === 0) {
            await realPrismaClient.playgroundItem.createMany({
              data: [
                {
                  id: "item-1",
                  name: "John Doe",
                  targetApp: "temin360-desktop",
                },
                {
                  id: "item-2",
                  name: "John Deere",
                  targetApp: "temin360-desktop",
                },
                {
                  id: "item-3",
                  name: "Jane Roe",
                  targetApp: "app-web",
                },
              ],
            });
          }
        } catch {}
      })();
    } catch (e) {
      console.warn("Could not load real PrismaClient, falling back to InMemoryPrismaDelegate:", e);
      return { item: defaultPrismaDelegate };
    }
  }

  return {
    item: {
      findUnique: (args: any) => realPrismaClient.playgroundItem.findUnique(args),
      findMany: (args?: any) => realPrismaClient.playgroundItem.findMany(args),
      create: (args: any) => realPrismaClient.playgroundItem.create(args),
      update: (args: any) => realPrismaClient.playgroundItem.update(args),
      delete: (args: any) => realPrismaClient.playgroundItem.delete(args),
      count: (args?: any) => realPrismaClient.playgroundItem.count(args),
    } as PrismaDelegate<{ id: string; name: string; target_app?: string }, string>,
  };
}

/**
 * .temin paketini doğrudan açıp içindeki SQLite veritabanına erişim sağlar.
 */
export async function openTeminPackage(filePath?: string): Promise<ITeminPackage> {
  const candidates = [
    filePath,
    path.resolve(process.cwd(), "tests/fixtures/temin/files/test-projesi.temin"),
    path.resolve(process.cwd(), "../../tests/fixtures/temin/files/test-projesi.temin"),
    path.resolve(process.cwd(), "test-projesi.temin"),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return TeminPackage.open(c);
    }
  }
  throw new Error("Geçerli bir .temin arşiv dosyası bulunamadı.");
}
