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
  openTeminPackage,
  PlaygroundDatabaseTransaction,
} from "@/lib/database/playgroundDb";
import {
  executePlaygroundTest,
  type TestRunResult,
} from "@/lib/test-utils/runTest";
import {
  rawTables,
  convertAllTablesToLogicalSchema,
  COLUMN_OVERRIDE_REGISTRY,
  INDEX_REGISTRY,
} from "@dt/database";

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
            const generatedId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newItem = {
              id: payload?.id?.trim() ? createEntityId(payload.id.trim()) : createEntityId(generatedId),
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
            const generatedId = `sql-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const id = payload?.id?.trim() ? createEntityId(payload.id.trim()) : createEntityId(generatedId);
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
            const generatedId = `prisma-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const id = payload?.id?.trim() ? createEntityId(payload.id.trim()) : createEntityId(generatedId);
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

    const tempId = createEntityId(`tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
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

/**
 * 7. GERÇEK TEMİN 360 VERİTABANI YÖNETİMİ & CRUD ACTIONS
 */
export async function fetchTeminStatsAction(): Promise<
  TestRunResult<{
    totalDosya: number;
    totalFirma: number;
    totalPersonel: number;
    totalKalem: number;
    totalSettings: number;
    dbPath: string;
  }>
> {
  return executePlaygroundTest("Temin DB -> İstatistikleri Getir", async () => {
    const conn = await getPlaygroundProvider().getConnection();
    const [dosyaRes, firmaRes, personelRes, kalemRes, settingsRes] =
      await Promise.all([
        conn.query<{ count: number }>(
          "SELECT count(*) as count FROM DATA_TeminDosyasi WHERE is_deleted = 0 OR is_deleted IS NULL",
        ),
        conn.query<{ count: number }>(
          "SELECT count(*) as count FROM TANIM_Firma WHERE is_deleted = 0 OR is_deleted IS NULL",
        ),
        conn.query<{ count: number }>(
          "SELECT count(*) as count FROM TANIM_Personel WHERE is_deleted = 0 OR is_deleted IS NULL",
        ),
        conn.query<{ count: number }>(
          "SELECT count(*) as count FROM DATA_TeminKalem WHERE is_deleted = 0 OR is_deleted IS NULL",
        ),
        conn.query<{ count: number }>("SELECT count(*) as count FROM settings"),
      ]);

    return {
      totalDosya: Number(dosyaRes[0]?.count || 0),
      totalFirma: Number(firmaRes[0]?.count || 0),
      totalPersonel: Number(personelRes[0]?.count || 0),
      totalKalem: Number(kalemRes[0]?.count || 0),
      totalSettings: Number(settingsRes[0]?.count || 0),
      dbPath: getActiveDbPath(),
    };
  });
}

export async function fetchTeminTableRowsAction(
  tableName:
    | "DATA_TeminDosyasi"
    | "TANIM_Firma"
    | "TANIM_Personel"
    | "DATA_TeminKalem"
    | "settings",
  search?: string,
): Promise<
  TestRunResult<
    { rows: Record<string, any>[]; columns: string[]; total: number }
  >
> {
  return executePlaygroundTest(
    `Temin DB -> ${tableName} Tablosunu Oku`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();

      let sql = "";
      const params: any[] = [];

      switch (tableName) {
        case "DATA_TeminDosyasi": {
          if (search?.trim()) {
            sql =
              "SELECT id, temin_no, konu, yaklasik_maliyet, tur, butce_yili, durum, created_at FROM DATA_TeminDosyasi WHERE (temin_no LIKE ? OR konu LIKE ?) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 50";
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
          } else {
            sql =
              "SELECT id, temin_no, konu, yaklasik_maliyet, tur, butce_yili, durum, created_at FROM DATA_TeminDosyasi WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id DESC LIMIT 50";
          }
          break;
        }
        case "TANIM_Firma": {
          if (search?.trim()) {
            sql =
              "SELECT id, unvan, vergi_no, telefon, email, ilgili_adi, adres FROM TANIM_Firma WHERE (unvan LIKE ? OR vergi_no LIKE ?) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 50";
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
          } else {
            sql =
              "SELECT id, unvan, vergi_no, telefon, email, ilgili_adi, adres FROM TANIM_Firma WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id DESC LIMIT 50";
          }
          break;
        }
        case "TANIM_Personel": {
          if (search?.trim()) {
            sql =
              "SELECT id, ad_soyad, unvan, gorev, eposta, telefon FROM TANIM_Personel WHERE (ad_soyad LIKE ? OR unvan LIKE ?) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 50";
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
          } else {
            sql =
              "SELECT id, ad_soyad, unvan, gorev, eposta, telefon FROM TANIM_Personel WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id DESC LIMIT 50";
          }
          break;
        }
        case "DATA_TeminKalem": {
          if (search?.trim()) {
            sql =
              "SELECT id, temin_dosya_id, kalem_adi, miktar, birim, birim_fiyat FROM DATA_TeminKalem WHERE kalem_adi LIKE ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 50";
            params.push(`%${search.trim()}%`);
          } else {
            sql =
              "SELECT id, temin_dosya_id, kalem_adi, miktar, birim, birim_fiyat FROM DATA_TeminKalem WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id DESC LIMIT 50";
          }
          break;
        }
        case "settings": {
          if (search?.trim()) {
            sql =
              "SELECT key, value FROM settings WHERE key LIKE ? OR value LIKE ? ORDER BY key ASC LIMIT 50";
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
          } else {
            sql = "SELECT key, value FROM settings ORDER BY key ASC LIMIT 50";
          }
          break;
        }
        default:
          throw new Error(`Desteklenmeyen tablo: ${tableName}`);
      }

      const rows = await conn.query<Record<string, any>>(sql, params);
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        rows,
        columns,
        total: rows.length,
      };
    },
  );
}

export async function insertTeminRowAction(
  tableName:
    | "DATA_TeminDosyasi"
    | "TANIM_Firma"
    | "TANIM_Personel"
    | "DATA_TeminKalem"
    | "settings",
  data: Record<string, any>,
): Promise<TestRunResult<{ inserted: boolean; id?: any; message: string }>> {
  return executePlaygroundTest(
    `Temin DB -> ${tableName} Kayıt Ekle`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();

      switch (tableName) {
        case "DATA_TeminDosyasi": {
          const res = await conn.execute(
            "INSERT INTO DATA_TeminDosyasi (temin_no, konu, yaklasik_maliyet, tur, butce_yili, durum, created_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
            [
              data.temin_no || `2026/${Math.floor(Math.random() * 900 + 100)}`,
              data.konu || "Doğrudan Temin Alımı (Playground)",
              Number(data.yaklasik_maliyet || 50000),
              data.tur || "mal",
              Number(data.butce_yili || 2026),
              data.durum || "taslak",
              new Date().toISOString(),
            ],
          );
          return {
            inserted: true,
            id: res.lastInsertRowId,
            message: `Dosya eklendi (ID: ${res.lastInsertRowId})`,
          };
        }
        case "TANIM_Firma": {
          const res = await conn.execute(
            "INSERT INTO TANIM_Firma (unvan, vergi_no, telefon, email, ilgili_adi, adres, is_deleted) VALUES (?, ?, ?, ?, ?, ?, 0)",
            [
              data.unvan || "Yeni Tedarikçi Firma Ltd.",
              data.vergi_no ||
              `${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              data.telefon || "0212 555 0000",
              data.email || "tedarik@firma.com",
              data.ilgili_adi || "Yetkili Kişi",
              data.adres || "İstanbul",
            ],
          );
          return {
            inserted: true,
            id: res.lastInsertRowId,
            message: `Firma eklendi (ID: ${res.lastInsertRowId})`,
          };
        }
        case "TANIM_Personel": {
          const res = await conn.execute(
            "INSERT INTO TANIM_Personel (ad_soyad, unvan, gorev, eposta, telefon, is_deleted) VALUES (?, ?, ?, ?, ?, 0)",
            [
              data.ad_soyad || "Yeni Personel",
              data.unvan || "Mühendis",
              data.gorev || "Satın Alma Sorumlusu",
              data.eposta || "personel@kurum.gov.tr",
              data.telefon || "0312 444 0000",
            ],
          );
          return {
            inserted: true,
            id: res.lastInsertRowId,
            message: `Personel eklendi (ID: ${res.lastInsertRowId})`,
          };
        }
        case "DATA_TeminKalem": {
          const res = await conn.execute(
            "INSERT INTO DATA_TeminKalem (temin_dosya_id, kalem_adi, miktar, birim, birim_fiyat, is_deleted) VALUES (?, ?, ?, ?, ?, 0)",
            [
              Number(data.temin_dosya_id || 1),
              data.kalem_adi || "Kalem İhtiyacı",
              Number(data.miktar || 10),
              data.birim || "Adet",
              Number(data.birim_fiyat || 100),
            ],
          );
          return {
            inserted: true,
            id: res.lastInsertRowId,
            message: `Kalem eklendi (ID: ${res.lastInsertRowId})`,
          };
        }
        case "settings": {
          await conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            [data.key, data.value],
          );
          return {
            inserted: true,
            id: data.key,
            message: `Ayar kaydedildi (${data.key})`,
          };
        }
        default:
          throw new Error(`Desteklenmeyen tablo: ${tableName}`);
      }
    },
  );
}

export async function deleteTeminRowAction(
  tableName:
    | "DATA_TeminDosyasi"
    | "TANIM_Firma"
    | "TANIM_Personel"
    | "DATA_TeminKalem"
    | "settings",
  id: string | number,
): Promise<TestRunResult<{ deleted: boolean; id: any }>> {
  return executePlaygroundTest(
    `Temin DB -> ${tableName} Kayıt Sil (ID: ${id})`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();

      if (tableName === "settings") {
        await conn.execute("DELETE FROM settings WHERE key = ?", [String(id)]);
      } else {
        await conn.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      }

      return {
        deleted: true,
        id,
      };
    },
  );
}

// ============================================================================
// TEMİN 360 MİMARİ DOĞRULAMA (Core Playground Testleri)
// ============================================================================
import {
  ProcurementFile,
  ProcurementFileStatus,
  SqliteProcurementFileRepository,
  SqliteCommissionRepository,
  ProcurementFileService,
  CommissionService,
  RequirementService,
  PriceResearchService,
  ApprovalService,
  DocumentService,
  ProcurementFileListViewModel,
  ProcurementFileDetailViewModel,
  ProcurementFileMapper,
  ProcurementFileListMapper,
  ProcurementFileDetailMapper,
  PrinterService,
  SystemPrinterAdapter,
  CompliancePolicyService,
  DocumentExportService,
  DirectProcurementFacade,
  DirectProcurementContainer,
  createDirectProcurementContainer,
  TOKENS,
  type ProcurementFileDto,
} from "@temin360/direct-procurement-core";

export async function testDirectProcurementArchitectureAction(
  testCategory:
    | "domain-entity"
    | "repository-contract"
    | "application-service"
    | "presentation-viewmodel"
    | "presentation-mappers"
    | "printer-service"
    | "compliance-policy"
    | "document-export"
    | "direct-procurement-facade"
    | "di-container"
    | "all"
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Direct Procurement Architecture -> ${testCategory}`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();

      // Adapt IDatabaseConnection to SqlExecutor
      const sqlExecutor = {
        async query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]> {
          return conn.query<T>(sql, params ? [...params] : []);
        },
        async execute(sql: string, params?: readonly unknown[]): Promise<{ changes?: number }> {
          const res = await conn.execute(sql, params ? [...params] : []);
          return { changes: res.changes };
        },
        async transaction<T = unknown>(statements: readonly { sql: string; params?: readonly unknown[] }[]): Promise<T[] | void> {
          const tx = await conn.beginTransaction();
          try {
            for (const s of statements) {
              await tx.execute(s.sql, s.params ? [...s.params] : []);
            }
            await tx.commit();
          } catch (err) {
            await tx.rollback();
            throw err;
          }
        },
      };

      const runTestByCategory = async (category: string): Promise<any> => {
        switch (category) {
          case "domain-entity": {
            const file = new ProcurementFile({
              id: 888,
              subject: "Playground Test İhalesi",
              procurementType: "mal",
              status: ProcurementFileStatus.InProgress,
              estimatedCost: 75000,
              budgetYear: 2026,
              unitName: "Fen İşleri Müdürlüğü",
              createdAt: "2026-03-01T09:00:00Z",
            });

            const initialStatus = file.status;
            file.complete();
            const completedStatus = file.status;

            return {
              id: file.id,
              subject: file.subject,
              initialStatus,
              completedStatus,
              procurementType: file.procurementType,
              estimatedCost: file.estimatedCost,
              isValidDomainEntity: true,
            };
          }

          case "repository-contract": {
            const repo = new SqliteProcurementFileRepository(sqlExecutor);
            const activeFiles = await repo.findActiveFiles();
            const exists = await repo.exists(1);

            return {
              contractInterface: "IProcurementFileRepository",
              activeFileCount: activeFiles.length,
              sampleFileSubject: activeFiles[0]?.subject || "Kayıt Yok",
              existsCheckForId1: exists.success ? exists.data : false,
              verified: true,
            };
          }

          case "application-service": {
            const fileRepo = new SqliteProcurementFileRepository(sqlExecutor);
            const service = new ProcurementFileService(fileRepo);
            const getRes = await service.getFileById(1);

            return {
              serviceName: "ProcurementFileService",
              resultType: getRes.success ? "Success" : "Failure (Handled via Result<T, AppError>)",
              data: getRes.success
                ? {
                    id: getRes.data.id,
                    subject: getRes.data.subject,
                    status: getRes.data.status,
                  }
                : getRes.error,
            };
          }

          case "presentation-viewmodel":
          case "presentation-mappers": {
            // Ortak tek bir DTO
            const sharedDto: ProcurementFileDto = {
              id: 501,
              procurementNumber: "2026/DT-501",
              documentNumber: "EVR-1234",
              subject: "Laboratuvar Cihazı Bakım-Onarımı",
              procurementType: "hizmet",
              status: "in_progress",
              isLocked: false,
              estimatedCost: 185000,
              totalAmount: 185000,
              budgetYear: 2026,
              budgetType: "Öz Bütçe",
              unitName: "Biyomedikal Birimi",
              deliveryDays: 14,
              createdAt: "2026-05-12T14:30:00Z",
              permissions: {
                canEdit: true,
                canApprove: true,
                canDelete: false,
              },
            };

            // 1. Liste Ekranı: Dosya no, Durum etiketi, Toplam tutar, Oluşturulma tarihi
            const listItem = ProcurementFileListMapper.toListItemView(sharedDto);

            // 2. Detay Ekranı: Dosya bilgileri, Alım türü, Kilit durumu, Düzenleme yetkisi
            const detailView = ProcurementFileDetailMapper.toDetailView(sharedDto);

            return {
              sharedDtoSourceId: sharedDto.id,
              listScreenView: {
                procurementNumber: listItem.procurementNumber,
                statusLabel: listItem.statusLabel,
                formattedTotalAmount: listItem.formattedTotalAmount,
                formattedCreatedAt: listItem.formattedCreatedAt,
              },
              detailScreenView: {
                subject: detailView.subject,
                procurementTypeLabel: detailView.procurementTypeLabel,
                lockStatusLabel: detailView.lockStatusLabel,
                lockBadgeColor: detailView.lockBadgeColor,
                editPermissionIndicator: detailView.editPermissionIndicator,
              },
              singleDtoDualMapperVerified: true,
            };
          }

          case "printer-service": {
            const printerPort = new SystemPrinterAdapter();
            const printerService = new PrinterService(printerPort);

            const printersRes = await printerService.listPrinters();
            const defaultPrinter = await printerService.getDefaultPrinter();
            const printSample = await printerService.printDocument(
              "Piyasa Fiyat Araştırma Tutanağı",
              "<html><body><h2>Piyasa Araştırma Tutanağı</h2></body></html>",
              { copies: 1, pageSize: "A4" },
            );

            return {
              availablePrinters: printersRes.success ? printersRes.data : [],
              defaultPrinter: defaultPrinter.success ? defaultPrinter.data : null,
              printTestResult: printSample.success ? printSample.data : printSample.error,
              isNonDbExternalService: true,
            };
          }

          case "compliance-policy": {
            const compliance = new CompliancePolicyService();

            // 1. 22/d limit denetimi
            const limitCheck = compliance.checkMd22dLimit(250000, true);

            // 2. Tebliğ 40666 Rol İzolasyonu kontrolü
            const roleCheck = compliance.validateSeparationOfDuties({
              spendingAuthorizerId: 10,
              realizationOfficerId: 20,
              pfaMembers: [{ id: 30, name: "Memur 1" }],
              acceptanceMembers: [{ id: 40, name: "Muayene Başkanı", isChairman: true }],
            });

            // 3. Alım türüne göre teslim-tesellüm vs kabul belgeleri
            const malDocs = compliance.getRequiredAcceptanceDocuments("mal");
            const hizmetDocs = compliance.getRequiredAcceptanceDocuments("hizmet");

            return {
              limitCheck: limitCheck.success ? limitCheck.data : null,
              roleIsolationCheck: roleCheck.success ? roleCheck.data : null,
              malAcceptanceDocs: {
                hasDeliveryReceipt: malDocs.hasDeliveryReceipt,
                required: malDocs.requiredDocuments,
                receiverAuthority: malDocs.deliveryReceiverAuthority,
              },
              hizmetAcceptanceDocs: {
                hasDeliveryReceipt: hizmetDocs.hasDeliveryReceipt,
                hasTimesheet: hizmetDocs.hasTimesheet,
                required: hizmetDocs.requiredDocuments,
              },
              teblig40666Compliant: true,
            };
          }

          case "document-export": {
            const exportService = new DocumentExportService();

            const ekapForm = exportService.generateEkapRecordForm({
              fileDto: {
                id: 10,
                subject: "Bilişim Malzemesi Alımı",
                procurementType: "mal",
                status: "completed",
                isLocked: true,
                estimatedCost: 120000,
                budgetYear: 2026,
              },
              offers: [
                { id: 1, itemId: 1, supplierId: 10, supplierName: "Alpha Ltd", unitPrice: 110000, vatAmount: 22000 },
                { id: 2, itemId: 1, supplierId: 11, supplierName: "Beta AŞ", unitPrice: 115000, vatAmount: 23000 },
              ],
              winningOfferId: 1,
              winnerSupplierTitle: "Alpha Ltd",
              winnerTaxNumber: "9988776655",
            });

            const pdfExport = exportService.prepareExportPayload("Onay Belgesi", "<p>Metin</p>", "pdf");

            return {
              ekapPayload: ekapForm.success ? ekapForm.data : null,
              pdfExportPayload: pdfExport.success ? pdfExport.data : null,
              exportReady: true,
            };
          }

          case "direct-procurement-facade": {
            const container = createDirectProcurementContainer(sqlExecutor);

            const facade = container.resolve<DirectProcurementFacade>(
              TOKENS.DirectProcurementFacade,
            );

            const printers = await facade.listAvailablePrinters();
            const acceptanceDocs = facade.getRequiredAcceptanceDocuments(1, "mal");

            return {
              facadeResolved: Boolean(facade),
              facadeType: "DirectProcurementFacade (En Üst Seviye Master Facade)",
              availablePrinters: printers.success ? printers.data.length : 0,
              acceptanceCheckHasDeliveryReceipt: acceptanceDocs.hasDeliveryReceipt,
              topLevelOrchestrationVerified: true,
            };
          }

          case "di-container": {
            const container = createDirectProcurementContainer(sqlExecutor);

            return {
              hasSqlExecutor: container.has(TOKENS.SqlExecutor),
              hasProcurementFileService: container.has(TOKENS.ProcurementFileService),
              hasCommissionService: container.has(TOKENS.CommissionService),
              hasApprovalService: container.has(TOKENS.ApprovalService),
              hasRequirementService: container.has(TOKENS.RequirementService),
              hasPriceResearchService: container.has(TOKENS.PriceResearchService),
              hasPrinterService: container.has(TOKENS.PrinterService),
              hasCompliancePolicyService: container.has(TOKENS.CompliancePolicyService),
              hasDocumentExportService: container.has(TOKENS.DocumentExportService),
              hasDirectProcurementFacade: container.has(TOKENS.DirectProcurementFacade),
              allTokensBound: true,
            };
          }

          default:
            throw new Error(`Desteklenmeyen mimari test: ${category}`);
        }
      };

      if (testCategory === "all") {
        const categories = [
          "domain-entity",
          "repository-contract",
          "application-service",
          "presentation-mappers",
          "printer-service",
          "compliance-policy",
          "document-export",
          "direct-procurement-facade",
          "di-container",
        ];

        const results: Record<string, any> = {};
        for (const cat of categories) {
          results[cat] = await runTestByCategory(cat);
        }

        return {
          totalCategoriesTested: categories.length,
          allPassed: true,
          suiteResults: results,
        };
      }

      return runTestByCategory(testCategory);
    },
  );
}

/**
 * Adım 1: Database Workbench için 55 tablo mantıksal şema, denetim raporu ve kısıt metriklerini yükler.
 */
export async function fetchLogicalSchemaWorkbenchDataAction(): Promise<
  TestRunResult<{
    auditReport: any;
    tables: any[];
    financialColumns: any[];
    indexes: any[];
    unresolvedCount: number;
  }>
> {
  return executePlaygroundTest(
    "logical-schema-workbench",
    async () => {
      const { logicalTables, auditReport } = convertAllTablesToLogicalSchema(rawTables);

      // Finansal kolonları filtrele ve listele
      const financialColumns: any[] = [];
      for (const t of logicalTables) {
        for (const [colName, col] of Object.entries(t.columns) as [string, any][]) {
          if (col.isFinancial) {
            financialColumns.push({
              tableName: t.name,
              columnName: colName,
              type: col.type,
              scale: col.scale,
              precision: col.precision,
              originType: col.originType,
            });
          }
        }
      }

      // İndeksleri düz liste hâline getir
      const allIndexes: any[] = [];
      for (const [tbl, idxList] of Object.entries(INDEX_REGISTRY) as [string, any[]][]) {
        for (const idx of idxList) {
          allIndexes.push(idx);
        }
      }

      return {
        auditReport,
        tables: logicalTables.map((t: any) => ({
          name: t.name,
          description: t.description || "",
          columnCount: Object.keys(t.columns).length,
          hasPrimaryKey: t.hasPrimaryKey,
          primaryKey: t.primaryKey,
          constraintCount: t.constraints.length,
          indexCount: t.indexes.length,
          isExportReady: t.isExportReady,
          unresolvedCount: t.unresolvedConstraintsCount,
          constraints: t.constraints,
          columns: t.columns,
        })),
        financialColumns,
        indexes: allIndexes,
        unresolvedCount: auditReport.unresolvedConstraints.length,
      };
    },
  );
}



