"use server";

import {
  AppError,
  ConflictError,
  createEntityId,
  createPaginationMeta,
  failure,
  type IDatabaseConnection,
  InMemoryRepository,
  NotFoundError,
  PrismaReadRepository,
  PrismaWriteRepository,
  SQLiteReadRepository,
  SQLiteWriteRepository,
  success,
  ValidationError,
} from "@/lib/core";
import {
  getActiveDbPath,
  getPlaygroundConnection,
  getPlaygroundPrismaClient,
  getPlaygroundProvider,
  PlaygroundDatabaseTransaction,
  openTeminPackage,
} from "@/lib/database/playgroundDb";
import {
  executePlaygroundTest,
  type TestRunResult,
} from "@/lib/test-utils/runTest";

// Concrete SQLite repositories for playground table
class PlaygroundSqliteReadRepo extends SQLiteReadRepository<
  { id: string; name: string; target_app?: string },
  string
> {
  constructor(conn: IDatabaseConnection) {
    super(conn, "playground_items");
  }
}

class PlaygroundSqliteWriteRepo extends SQLiteWriteRepository<
  { id: string; name: string; target_app?: string },
  string
> {
  constructor(conn: IDatabaseConnection) {
    super(conn, "playground_items");
  }
}

// Concrete Prisma repositories for playground table
class PlaygroundPrismaReadRepo extends PrismaReadRepository<
  { id: string; name: string; target_app?: string },
  string
> {
  constructor(delegate: any) {
    super(delegate, "Item");
  }
}

class PlaygroundPrismaWriteRepo extends PrismaWriteRepository<
  { id: string; name: string; target_app?: string },
  string
> {
  constructor(delegate: any) {
    super(delegate, "Item");
  }
}

// Singleton in-memory repository instance for playground session
const inMemoryRepo = new InMemoryRepository<
  { id: string; name: string; targetApp?: string },
  string
>();

// Seed initial item into inMemoryRepo
inMemoryRepo.create({
  id: "item-1",
  name: "John Doe",
  targetApp: "temin360-desktop",
});
inMemoryRepo.create({
  id: "item-2",
  name: "John Deere",
  targetApp: "temin360-desktop",
});
inMemoryRepo.create({ id: "item-3", name: "Jane Roe", targetApp: "app-web" });

/**
 * 1. REPOSITORY TEST ACTION
 */
export async function testRepositoryAction(
  adapter: "in-memory" | "sqlite" | "prisma",
  operation: "getAll" | "getById" | "create" | "update" | "delete" | "exists",
  payload?: any,
  targetApp = "temin360-desktop",
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Repository [${adapter}] -> ${operation}`,
    async () => {
      if (adapter === "in-memory") {
        switch (operation) {
          case "getAll": {
            const res = await inMemoryRepo.getAll();
            if (!res.success) throw res.error;
            return res.data;
          }
          case "getById": {
            const id = payload?.id || "item-1";
            const res = await inMemoryRepo.getById(id);
            if (!res.success) throw res.error;
            return res.data;
          }
          case "create": {
            const newItem = {
              id: payload?.id || createEntityId("item"),
              name: payload?.name || "John Deere",
              targetApp,
            };
            const res = await inMemoryRepo.create(newItem);
            if (!res.success) throw res.error;
            return res.data;
          }
          case "update": {
            const id = payload?.id || "item-1";
            const res = await inMemoryRepo.update(id, {
              name: payload?.name || "John Deere (Updated)",
            });
            if (!res.success) throw res.error;
            return res.data;
          }
          case "delete": {
            const id = payload?.id || "item-1";
            const res = await inMemoryRepo.delete(id);
            if (!res.success) throw res.error;
            return { deleted: true, id };
          }
          case "exists": {
            const id = payload?.id || "item-1";
            const res = await inMemoryRepo.exists(id);
            if (!res.success) throw res.error;
            return { id, isPresent: res.data };
          }
        }
      }

      if (adapter === "sqlite") {
        const conn = getPlaygroundConnection();
        const readRepo = new PlaygroundSqliteReadRepo(conn);
        const writeRepo = new PlaygroundSqliteWriteRepo(conn);

        switch (operation) {
          case "getAll": {
            const res = await readRepo.getAll();
            if (!res.success) throw res.error;
            return res.data;
          }
          case "getById": {
            const id = payload?.id || "item-1";
            const res = await readRepo.getById(id);
            if (!res.success) throw res.error;
            return res.data;
          }
          case "create": {
            const id = payload?.id || createEntityId("sql");
            const item = {
              id,
              name: payload?.name || "John Doe",
              target_app: targetApp,
            };
            const res = await writeRepo.create(item);
            if (!res.success) throw res.error;
            return res.data;
          }
          case "update": {
            const id = payload?.id || "item-1";
            const res = await writeRepo.update(id, {
              name: payload?.name || "John Doe (Updated)",
            });
            if (!res.success) throw res.error;
            return res.data;
          }
          case "delete": {
            const id = payload?.id || "item-1";
            const res = await writeRepo.delete(id);
            if (!res.success) throw res.error;
            return { deleted: true, id };
          }
          case "exists": {
            const id = payload?.id || "item-1";
            const res = await readRepo.exists(id);
            if (!res.success) throw res.error;
            return { id, isPresent: res.data };
          }
        }
      }

      if (adapter === "prisma") {
        const prismaClient = getPlaygroundPrismaClient();
        const readRepo = new PlaygroundPrismaReadRepo(prismaClient.item);
        const writeRepo = new PlaygroundPrismaWriteRepo(prismaClient.item);

        switch (operation) {
          case "getAll": {
            const res = await readRepo.getAll();
            if (!res.success) throw res.error;
            return res.data;
          }
          case "getById": {
            const id = payload?.id || "item-1";
            const res = await readRepo.getById(id);
            if (!res.success) throw res.error;
            return res.data;
          }
          case "create": {
            const id = payload?.id || createEntityId("prisma");
            const item = {
              id,
              name: payload?.name || "Jane Roe",
              target_app: targetApp,
            };
            const res = await writeRepo.create(item);
            if (!res.success) throw res.error;
            return res.data;
          }
          case "update": {
            const id = payload?.id || "item-1";
            const res = await writeRepo.update(id, {
              name: payload?.name || "Jane Roe (Updated)",
            });
            if (!res.success) throw res.error;
            return res.data;
          }
          case "delete": {
            const id = payload?.id || "item-1";
            const res = await writeRepo.delete(id);
            if (!res.success) throw res.error;
            return { deleted: true, id };
          }
          case "exists": {
            const id = payload?.id || "item-1";
            const res = await readRepo.exists(id);
            if (!res.success) throw res.error;
            return { id, isPresent: res.data };
          }
        }
      }

      throw new Error(`Bilinmeyen adaptör: ${adapter}`);
    },
  );
}

/**
 * 2. DATABASE TEST ACTION
 */
export async function testDatabaseAction(
  operation: "query" | "execute" | "health",
  sql?: string,
  params?: any[],
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Database Connection -> ${operation}`,
    async () => {
      const provider = getPlaygroundProvider();
      const conn = await provider.getConnection();

      if (operation === "health") {
        const rows = await conn.query(
          'SELECT 1 as is_alive, datetime("now") as server_time',
        );
        let settingsInfo: any[] = [];
        try {
          settingsInfo = await conn.query(
            "SELECT key, value FROM settings WHERE key IN ('adminUsername', 'adminName', 'institutionName')",
          );
        } catch {}
        return {
          status: "CONNECTED",
          provider: "PlaygroundDatabaseProvider",
          databasePath: getActiveDbPath(),
          engine: "SQLite (test-projesi.temin / test-projesi.sqlite)",
          credentials: {
            username: "Acme",
            passwordConfigured: true,
            institution: "Acme Corporation",
          },
          settings: settingsInfo,
          result: rows,
        };
      }

      if (operation === "query") {
        const querySql = sql ||
          "SELECT * FROM playground_items ORDER BY id ASC";
        const rows = await conn.query(querySql, params || []);
        return {
          sql: querySql,
          rowCount: rows.length,
          rows,
        };
      }

      if (operation === "execute") {
        const execSql = sql ||
          "INSERT INTO playground_items (id, name, target_app) VALUES (?, ?, ?)";
        const execParams = params ||
          [createEntityId("cmd"), "Komut ile Eklendi", "temin360-desktop"];
        const affected = await conn.execute(execSql, execParams);
        return {
          sql: execSql,
          params: execParams,
          changes: affected.changes,
          lastInsertRowId: affected.lastInsertRowId,
        };
      }

      throw new Error(`Bilinmeyen işlem: ${operation}`);
    },
  );
}

/**
 * 2.1 AUTH & REMEMBER ME / CREDENTIAL VERIFICATION ACTIONS
 */
export async function getRememberedCredentialsAction(): Promise<
  TestRunResult<{
    rememberMe: boolean;
    rememberedUsername: string;
    rememberedPassword: string;
    adminUsername: string;
    database: string;
  }>
> {
  return executePlaygroundTest(
    "Auth -> Get Remembered Credentials from DB",
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      const rows = await conn.query<{ key: string; value: string }>(
        "SELECT key, value FROM settings WHERE key IN ('adminUsername', 'rememberMe', 'rememberedUsername', 'rememberedPassword')",
      );
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

      const rememberMe = map["rememberMe"] === "true";
      const rememberedUsername = map["rememberedUsername"] ||
        map["adminUsername"] || "";
      const rememberedPassword = rememberMe
        ? map["rememberedPassword"] || ""
        : "";

      return {
        rememberMe,
        rememberedUsername,
        rememberedPassword,
        adminUsername: map["adminUsername"] || "",
        database: getActiveDbPath(),
      };
    },
  );
}

export async function saveRememberedCredentialsAction(params: {
  username: string;
  password?: string;
  rememberMe: boolean;
}): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Auth -> Save Remember Me (${params.rememberMe ? "Aktif" : "Pasif"}) to DB`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      if (params.rememberMe) {
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberMe', 'true')",
        );
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberedUsername', ?)",
          [params.username],
        );
        if (params.password) {
          await conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberedPassword', ?)",
            [params.password],
          );
        }
      } else {
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberMe', 'false')",
        );
        await conn.execute(
          "DELETE FROM settings WHERE key IN ('rememberedPassword')",
        );
      }

      const rows = await conn.query<{ key: string; value: string }>(
        "SELECT key, value FROM settings WHERE key IN ('rememberMe', 'rememberedUsername', 'rememberedPassword')",
      );
      return {
        updated: true,
        currentSettings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
        database: getActiveDbPath(),
      };
    },
  );
}

export async function testAuthAction(
  username: string = "Acme",
  password: string = "AcmeAcme",
  rememberMe?: boolean,
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(`Auth Verification -> ${username}`, async () => {
    const conn = await getPlaygroundProvider().getConnection();
    const rows = await conn.query<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE key IN ('adminUsername', 'adminPassword', 'institutionName', 'rememberMe', 'rememberedUsername', 'rememberedPassword')",
    );
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const matchedUser = map["adminUsername"] === username;

    const stored = map["adminPassword"];
    let verified = false;
    if (stored && stored.startsWith("scrypt$")) {
      const [, salt, hash] = stored.split("$");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require("node:crypto");
      const expected = Buffer.from(hash, "hex");
      const actual = crypto.scryptSync(password, salt, expected.length);
      verified = crypto.timingSafeEqual(expected, actual);
    }

    // Beni Hatırla DB senkronizasyonu
    if (matchedUser && verified && typeof rememberMe === "boolean") {
      if (rememberMe) {
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberMe', 'true')",
        );
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberedUsername', ?)",
          [username],
        );
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberedPassword', ?)",
          [password],
        );
      } else {
        await conn.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('rememberMe', 'false')",
        );
        await conn.execute(
          "DELETE FROM settings WHERE key IN ('rememberedPassword')",
        );
      }
    }

    return {
      username,
      userFound: matchedUser,
      passwordValid: verified,
      authenticated: matchedUser && verified,
      role: "admin",
      institution: map["institutionName"] || "Acme Corporation",
      rememberMe: typeof rememberMe === "boolean"
        ? rememberMe
        : map["rememberMe"] === "true",
      database: getActiveDbPath(),
    };
  });
}

/**
 * 3. TRANSACTION TEST ACTION
 */
export async function testTransactionAction(
  scenario: "commit-scenario" | "rollback-scenario",
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(`Transaction -> ${scenario}`, async () => {
    const provider = getPlaygroundProvider();
    const conn = await provider.getConnection();
    const tx = new PlaygroundDatabaseTransaction(conn);
    await tx.begin();

    const tempId = createEntityId("tx_item");
    const steps: any[] = [];

    steps.push({
      step: 1,
      action: "BEGIN (SQLite Savepoint / Transaction)",
      txActive: tx.isActive,
    });

    // Insert into table within transaction
    await tx.execute(
      "INSERT INTO playground_items (id, name, target_app) VALUES (?, ?, ?)",
      [
        tempId,
        `Transaction Deneme (${scenario})`,
        "temin360-desktop",
      ],
    );
    steps.push({ step: 2, action: "INSERT_WITHIN_TX", id: tempId });

    if (scenario === "commit-scenario") {
      await tx.commit();
      steps.push({ step: 3, action: "COMMIT", txActive: tx.isActive });

      // Verify item exists after commit
      const check = await conn.query(
        "SELECT * FROM playground_items WHERE id = ?",
        [tempId],
      );
      steps.push({
        step: 4,
        action: "VERIFY_AFTER_COMMIT",
        itemPersisted: check.length > 0,
        data: check[0],
      });

      return {
        scenario: "COMMIT Başarıyla Gerçekleşti",
        isCommitted: true,
        steps,
      };
    } else {
      await tx.rollback();
      steps.push({ step: 3, action: "ROLLBACK", txActive: tx.isActive });

      // Verify item does NOT exist after rollback
      const check = await conn.query(
        "SELECT * FROM playground_items WHERE id = ?",
        [tempId],
      );
      steps.push({
        step: 4,
        action: "VERIFY_AFTER_ROLLBACK",
        itemPersisted: check.length > 0,
        explanation:
          "Kayıt veritabanından tamamen geri alındı (ACID Atomicity kanıtı)",
      });

      return {
        scenario: "ROLLBACK Başarıyla Gerçekleşti",
        isRolledBack: true,
        steps,
      };
    }
  });
}

/**
 * 4. COMMON TYPES & RESULT TEST ACTION
 */
export async function testCommonAction(
  type: "result-ok" | "result-fail" | "entity-id" | "pagination",
  payload?: any,
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(`Common Types -> ${type}`, async () => {
    switch (type) {
      case "result-ok": {
        const value = payload?.value ||
          { dosyaNo: "2026/1", title: "Doğrudan Temin Dosyası" };
        const res = success(value);
        return {
          success: res.success,
          data: res.data,
        };
      }
      case "result-fail": {
        const errorMsg = payload?.error ||
          "Doğrulama hatası: Komisyon üyesi eksik";
        const res = failure(new Error(errorMsg));
        return {
          success: res.success,
          error: res.error.message,
        };
      }
      case "entity-id": {
        const prefix = payload?.prefix || "dosya";
        const generatedId = createEntityId(prefix);
        return {
          prefix,
          generatedId,
          type: typeof generatedId,
          length: generatedId.length,
        };
      }
      case "pagination": {
        const total = Number(payload?.total ?? 47);
        const page = Number(payload?.page ?? 2);
        const limit = Number(payload?.limit ?? 10);
        const meta = createPaginationMeta(total, page, limit);
        return {
          inputs: { total, page, limit },
          paginationMeta: meta,
        };
      }
    }
  });
}

/**
 * 5. ERROR TEST ACTION
 */
export async function testErrorAction(
  errorType: "AppError" | "ValidationError" | "NotFoundError" | "ConflictError",
  payload?: any,
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(`Error Handling -> ${errorType}`, async () => {
    let errorToThrow: Error;

    switch (errorType) {
      case "ValidationError":
        errorToThrow = new ValidationError(
          payload?.message ||
            "Girilen personel bilgileri mevzuat kurallarına uymuyor",
          [
            {
              field: payload?.details?.field || "tc_kimlik_no",
              message: payload?.details?.rule || "Must be 11 digits",
              code: "INVALID_FORMAT",
            },
          ],
        );
        break;
      case "NotFoundError":
        errorToThrow = new NotFoundError({
          resource: payload?.resource || "DATA_TeminDosyasi",
          resourceId: payload?.identifier || "DOSYA-2026-999",
        });
        break;
      case "ConflictError":
        errorToThrow = new ConflictError({
          resource: "DATA_TeminDosyasi",
          resourceId: payload?.details?.teminNo || "2026/1",
          message: payload?.message ||
            "Aynı temin numarasına sahip başka bir dosya zaten mevcut",
        });
        break;
      case "AppError":
      default:
        errorToThrow = new AppError({
          code: payload?.code || "CORE_GENERIC_FAULT",
          message: payload?.message ||
            "İşlem sırasında beklenmeyen bir çekirdek uygulama hatası oluştu",
        });
        break;
    }

    throw errorToThrow;
  });
}

/**
 * 6. TEMIN PACKAGE (.temin ARŞİVİ VE İÇİNDEKİ DATABASE.SQLITE) TEST ACTION
 */
export async function testTeminPackageAction(
  filePath?: string,
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    "TeminPackage -> .temin Arşivi ve SQLite Veritabanı Ayıklama",
    async () => {
      const pkg = await openTeminPackage(filePath);

      try {
        const meta = pkg.meta;
        const dbPath = pkg.getDatabasePath();
        const prismaUrl = pkg.getPrismaDatasourceUrl();
        const attachments = pkg.attachments;

        // Ayıklanan database.sqlite üzerinden doğrudan canlı SQL sorgusu
        const conn = await pkg.getConnection();
        const settings = await conn.query<{ key: string; value: string }>(
          "SELECT key, value FROM settings WHERE key IN ('adminUsername', 'institutionName', 'dbVersion', 'rememberMe')",
        );
        const settingsMap = Object.fromEntries(
          settings.map((r) => [r.key, r.value]),
        );

        let filesCount = 0;
        try {
          const countRes = await conn.query<{ count: number }>(
            "SELECT count(*) as count FROM DATA_TeminDosyasi",
          );
          filesCount = Number(countRes[0]?.count || 0);
        } catch {}

        return {
          archivePath: pkg.filePath,
          activeDbFileName: pkg.activeDbFileName,
          extractedDbPath: dbPath,
          prismaDatasourceUrl: prismaUrl,
          meta: {
            projectId: meta.project_id,
            institution: meta.institution,
            appVersion: meta.app_version,
            createdAt: meta.created_at,
          },
          attachmentsCount: attachments.length,
          databaseSettings: settingsMap,
          totalFilesInData: filesCount,
        };
      } finally {
        await pkg.close();
      }
    },
  );
}
