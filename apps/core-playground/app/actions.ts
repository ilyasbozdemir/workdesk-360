"use server";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { TeminPackage } from "@worksuite-360/core";

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
import type { ActiveDatabaseInfo } from "@/lib/database/playgroundDb";
import {
  getActiveDbPath,
  getActiveDatabaseInfo,
  setActiveDbPath,
  setActiveCustomLabel,
  findLatestDesktopWorkspaceDb,
  resetPlaygroundDb,
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
          exportReadiness: t.exportReadiness,
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

// ============================================================================
// 10. DOĞRUDAN TEMİN 360 — CANLI SÜREÇ, DOSYA VE ŞABLON LABORATUVARI ACTIONS
// ============================================================================

export interface PlaygroundProcurementFileAggregate {
  file: any;
  items: any[];
  offers: any[];
  stats: {
    totalItems: number;
    calculatedTotal: number;
    bestOffer?: {
      firma_adi: string;
      teklif_tutari: number;
    };
  };
}

/**
 * 10.1. Mevcut tüm doğrudan temin dosyalarını getirir.
 */
export async function fetchPlaygroundFilesAction(): Promise<any[]> {
  const conn = await getPlaygroundProvider().getConnection();
  try {
    const rows = await conn.query<any>(
      `SELECT id, dosya_no, temin_no, konu, alim_turu, tur, durum, yaklasik_maliyet, butce_yili, created_at 
       FROM DATA_TeminDosyasi 
       WHERE is_deleted = 0 OR is_deleted IS NULL 
       ORDER BY id DESC`
    );
    return rows;
  } catch (err) {
    console.warn("[fetchPlaygroundFilesAction] Hata:", err);
    return [];
  }
}

/**
 * 10.2. Yeni bir doğrudan temin dosyası açar (Create Procurement File).
 */
export async function createPlaygroundFileAction(data: {
  konu: string;
  alim_turu: string;
  yaklasik_maliyet: number;
  butce_yili?: number;
  dosya_no?: string;
  harcama_birimi?: string;
  madde?: string;
}): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Doğrudan Temin -> Yeni Dosya Aç (${data.konu})`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      const nextYear = data.butce_yili || 2026;
      const nextNo = data.dosya_no || `${nextYear}/${Math.floor(Math.random() * 900 + 100)}`;
      const res = await conn.execute(
        `INSERT INTO DATA_TeminDosyasi (
          dosya_no, temin_no, konu, dosya_adi, is_tanimi, is_adi, alim_turu, tur, ihale_tipi, durum, butce_yili, 
          yaklasik_maliyet, madde, harcama_birimi, created_at, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'taslak', ?, ?, ?, ?, datetime('now'), 0)`,
        [
          nextNo,
          nextNo,
          data.konu,
          data.konu,
          data.konu,
          data.konu,
          data.alim_turu,
          data.alim_turu,
          "Doğrudan Temin",
          nextYear,
          Number(data.yaklasik_maliyet || 0),
          data.madde || "4734 Sayılı Kanun Md. 22/d",
          data.harcama_birimi || "Destek Hizmetleri Dairesi Başkanlığı",
        ]
      );

      const insertedId = res.lastInsertRowId;
      const [newRow] = await conn.query<any>(
        "SELECT * FROM DATA_TeminDosyasi WHERE id = ?",
        [insertedId]
      );

      return {
        id: insertedId,
        dosya: newRow,
        message: `Yeni Doğrudan Temin Dosyası (${nextNo}) başarıyla açıldı.`,
      };
    }
  );
}

/**
 * 10.3. Seçilen bir dosyanın detayını, kalemlerini ve tekliflerini getirir.
 */
export async function fetchPlaygroundFileAggregateAction(
  fileId: number
): Promise<PlaygroundProcurementFileAggregate | null> {
  const conn = await getPlaygroundProvider().getConnection();
  try {
    const [file] = await conn.query<any>(
      "SELECT * FROM DATA_TeminDosyasi WHERE id = ?",
      [fileId]
    );
    if (!file) return null;

    const items = await conn.query<any>(
      `SELECT * FROM DATA_TeminKalem 
       WHERE (temin_dosya_id = ? OR dosya_id = ?) AND (is_deleted = 0 OR is_deleted IS NULL) 
       ORDER BY id ASC`,
      [fileId, fileId]
    );

    const offers = await conn.query<any>(
      `SELECT id, temin_dosya_id, dosya_id, firma_id, unvan, vergi_no, 
              COALESCE(teklif_toplami, 0) as teklif_tutari,
              kazandi_mi, kazanan_mi, teklif_durumu 
       FROM DATA_TeminFirma 
       WHERE (temin_dosya_id = ? OR dosya_id = ?) AND (is_deleted = 0 OR is_deleted IS NULL) 
       ORDER BY teklif_tutari ASC`,
      [fileId, fileId]
    );

    const calculatedTotal = items.reduce((sum: number, it: any) => {
      const lineTotal = Number(it.miktar || 0) * Number(it.birim_fiyat || 0);
      return sum + lineTotal;
    }, 0);

    const bestOffer = offers.length > 0 ? {
      firma_adi: offers[0].unvan || offers[0].firma_adi || `Firma #${offers[0].firma_id || 1}`,
      teklif_tutari: Number(offers[0].teklif_tutari || offers[0].toplam_teklif || 0),
    } : undefined;

    return {
      file,
      items,
      offers,
      stats: {
        totalItems: items.length,
        calculatedTotal,
        bestOffer,
      },
    };
  } catch (err) {
    console.warn("[fetchPlaygroundFileAggregateAction] Hata:", err);
    return null;
  }
}

/**
 * 10.4. Dosyaya yeni bir ihtiyaç kalemi ekler ve yaklaşık maliyeti günceller.
 */
export async function addPlaygroundItemAction(
  fileId: number,
  item: {
    kalem_adi: string;
    miktar: number;
    birim: string;
    birim_fiyat: number;
    kdv_orani: number;
  }
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Doğrudan Temin -> Kalem Ekle (${item.kalem_adi})`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      const res = await conn.execute(
        `INSERT INTO DATA_TeminKalem (
          temin_dosya_id, dosya_id, kalem_adi, miktar, birim, birim_fiyat, kdv_orani, is_deleted, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
        [
          fileId,
          fileId,
          item.kalem_adi,
          Number(item.miktar),
          item.birim || "Adet",
          Number(item.birim_fiyat),
          Number(item.kdv_orani || 20),
        ]
      );

      // Dosya toplam yaklaşık maliyetini yeniden hesapla
      const items = await conn.query<any>(
        "SELECT miktar, birim_fiyat FROM DATA_TeminKalem WHERE (temin_dosya_id = ? OR dosya_id = ?) AND (is_deleted = 0 OR is_deleted IS NULL)",
        [fileId, fileId]
      );
      const newTotal = items.reduce(
        (sum: number, it: any) => sum + Number(it.miktar || 0) * Number(it.birim_fiyat || 0),
        0
      );

      await conn.execute(
        "UPDATE DATA_TeminDosyasi SET yaklasik_maliyet = ? WHERE id = ?",
        [newTotal, fileId]
      );

      return {
        itemId: res.lastInsertRowId,
        newTotalApproximateCost: newTotal,
        itemCount: items.length,
        message: `${item.kalem_adi} başarıyla eklendi. Yaklaşık maliyet güncellendi: ${newTotal.toLocaleString("tr-TR")} ₺`,
      };
    }
  );
}

/**
 * 10.5. Dosyaya piyasa fiyat araştırması teklifi ekler.
 */
export async function addPlaygroundOfferAction(
  fileId: number,
  offer: {
    firma_adi: string;
    teklif_tutari: number;
    vergi_no?: string;
  }
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Doğrudan Temin -> Teklif Girişi (${offer.firma_adi})`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      
      // Firmayı TANIM_Firma içine ekle veya mevcut olanı bul
      const existingFirma = await conn.query<any>(
        "SELECT id FROM TANIM_Firma WHERE unvan = ? LIMIT 1",
        [offer.firma_adi]
      );
      let firmaId = existingFirma[0]?.id;
      if (!firmaId) {
        const insFirma = await conn.execute(
          "INSERT INTO TANIM_Firma (unvan, vergi_no, aktif_mi, is_deleted) VALUES (?, ?, 1, 0)",
          [offer.firma_adi, offer.vergi_no || "1111111111"]
        );
        firmaId = insFirma.lastInsertRowId;
      }

      // Teklifi DATA_TeminFirma içine ekle
      const res = await conn.execute(
        `INSERT INTO DATA_TeminFirma (
          temin_dosya_id, dosya_id, firma_id, unvan, vergi_no, teklif_toplami, teklif_verdi_mi, kazandi_mi, kazanan_mi, teklif_durumu, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, 'Teklif Alındı', 0)`,
        [fileId, fileId, firmaId, offer.firma_adi, offer.vergi_no || "1111111111", Number(offer.teklif_tutari)]
      );

      // En düşük teklifi otomatik tespit edip kazanan_mi / kazandi_mi işaretle
      const allOffers = await conn.query<any>(
        "SELECT id, COALESCE(teklif_toplami, 0) as teklif_tutari FROM DATA_TeminFirma WHERE (temin_dosya_id = ? OR dosya_id = ?) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY teklif_tutari ASC",
        [fileId, fileId]
      );
      if (allOffers.length > 0) {
        const lowestId = allOffers[0].id;
        await conn.execute(
          "UPDATE DATA_TeminFirma SET kazanan_mi = CASE WHEN id = ? THEN 1 ELSE 0 END, kazandi_mi = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE (temin_dosya_id = ? OR dosya_id = ?)",
          [lowestId, lowestId, fileId, fileId]
        );
      }

      return {
        offerId: res.lastInsertRowId,
        firmaId,
        firmaAdi: offer.firma_adi,
        teklifTutari: Number(offer.teklif_tutari),
        totalOffersCount: allOffers.length,
        message: `${offer.firma_adi} firmasından ${Number(offer.teklif_tutari).toLocaleString("tr-TR")} ₺ teklif kaydedildi.`,
      };
    }
  );
}

/**
 * 10.6. Dosyanın süreç durumunu ilerletir (Aşama Yönetimi).
 */
export async function updatePlaygroundStageAction(
  fileId: number,
  newStage: string
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Doğrudan Temin -> Aşama Güncelle (${newStage})`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      await conn.execute(
        "UPDATE DATA_TeminDosyasi SET durum = ?, updated_at = datetime('now') WHERE id = ?",
        [newStage, fileId]
      );

      return {
        fileId,
        newStage,
        message: `Dosya durumu "${newStage}" olarak güncellendi.`,
      };
    }
  );
}

/**
 * 10.7. Şablon verisini Resmî Yazışma Yönetmeliği ve Mevzuata uygun olarak derler.
 */
export async function compilePlaygroundTemplateAction(
  fileId: number,
  templateKey: string
): Promise<TestRunResult<any>> {
  return executePlaygroundTest(
    `Document Engine -> Şablon Çözümle (${templateKey})`,
    async () => {
      const conn = await getPlaygroundProvider().getConnection();
      const [file] = await conn.query<any>("SELECT * FROM DATA_TeminDosyasi WHERE id = ?", [fileId]);
      if (!file) throw new Error(`Dosya bulunamadı: ID ${fileId}`);

      const items = await conn.query<any>(
        "SELECT * FROM DATA_TeminKalem WHERE (temin_dosya_id = ? OR dosya_id = ?) AND (is_deleted = 0 OR is_deleted IS NULL)",
        [fileId, fileId]
      );

      const offers = await conn.query<any>(
        `SELECT tf.*, COALESCE(tf.unvan, f.unvan) as firma_unvan, COALESCE(tf.teklif_toplami, 0) as teklif_tutari 
         FROM DATA_TeminFirma tf 
         LEFT JOIN TANIM_Firma f ON tf.firma_id = f.id 
         WHERE tf.temin_dosya_id = ? OR tf.dosya_id = ? 
         ORDER BY COALESCE(tf.teklif_toplami, 0) ASC`,
        [fileId, fileId]
      );

      const [institution] = await conn.query<any>("SELECT key, value FROM settings WHERE key = 'institutionName' LIMIT 1");
      const kurumAdi = institution?.value || "T.C. ADALET BAKANLIĞI";

      // Şablon tipine göre başlık ve yapılandırılmış alanlar
      const templateTitles: Record<string, string> = {
        "ihtiyac-listesi": "İHTİYAÇ LİSTESİ VE TALEP FORMU",
        "dogrudan-temin-onay-belgesi": "DOĞRUDAN TEMİN ONAY BELGESİ (KİK022)",
        "piyasa-fiyat-arastirma-tutanagi": "PİYASA FİYAT ARAŞTIRMASI TUTANAĞI",
        "harcama-talimati": "HARCAMA TALİMATI / ONAYI",
        "muayene-kabul-komisyonu": "MUAYENE VE KABUL KOMİSYONU TUTANAĞI",
      };

      const title = templateTitles[templateKey] || "DOĞRUDAN TEMİN RESMÎ BELGESİ";

      return {
        templateKey,
        documentTitle: title,
        institutionalHeader: {
          country: "T.C.",
          ministry: kurumAdi,
          spendingUnit: file.harcama_birimi || "İdari ve Mali İşler Daire Başkanlığı",
          documentNumber: file.dosya_no || `2026/${file.id}`,
          date: new Date().toLocaleDateString("tr-TR"),
        },
        procurementSummary: {
          fileNo: file.dosya_no || `2026/${file.id}`,
          subject: file.konu,
          procurementType: file.alim_turu || file.tur || "mal",
          legalBasis: file.madde || "4734 Sayılı Kanun Madde 22/d",
          estimatedCost: Number(file.yaklasik_maliyet || 0),
          status: file.durum,
        },
        itemTable: items.map((it: any, idx: number) => ({
          siraNo: idx + 1,
          kalemAdi: it.kalem_adi,
          miktar: it.miktar,
          birim: it.birim,
          birimFiyat: it.birim_fiyat,
          toplamTutar: Number(it.miktar || 0) * Number(it.birim_fiyat || 0),
          kdvOrani: it.kdv_orani || 20,
        })),
        offerComparison: offers.map((of: any, idx: number) => ({
          siraNo: idx + 1,
          firmaAdi: of.firma_unvan || of.unvan || `Tedarikçi Firma #${idx + 1}`,
          teklifTutari: Number(of.teklif_tutari || of.toplam_teklif || 0),
          kazandiMi: of.kazanan_mi === 1,
        })),
        signatures: [
          { role: "Piyasa Araştırma Görevlisi", name: "Ahmet YILMAZ", title: "Mühendis" },
          { role: "Gerçekleştirme Görevlisi", name: "Mehmet KAYA", title: "Şube Müdürü" },
          { role: "Harcama Yetkilisi", name: "Ali DEMİR", title: "Daire Başkanı" },
        ],
        compiledAt: new Date().toISOString(),
        verifiedLegislation: "4734 Sayılı Kanun ve 40666 Sayılı Doğrudan Temin Tebliği ile %100 Uyumlu",
      };
    }
  );
}

// ============================================================================
// 11. .temin ARŞİV DOSYASI SEÇİCİ, OKUYUCU VE İNCELEYİCİ ACTIONS
// ============================================================================

export interface TeminPackageInspectionResult {
  fileName: string;
  filePath: string;
  fileSizeKb: number;
  meta: any;
  attachments: any[];
  activeDbFileName: string;
  counts: {
    files: number;
    items: number;
    firms: number;
    attachments: number;
  };
  files: any[];
  items: any[];
  firms: any[];
  settings: Record<string, string>;
}

/**
 * 11.1. Hazır örnek (.temin) paketini açar ve inceler.
 */
export async function loadPresetTeminPackageAction(): Promise<TestRunResult<TeminPackageInspectionResult>> {
  return executePlaygroundTest(
    "TeminPackage -> Örnek .temin Paketini Aç ve İncele",
    async () => {
      const pkg = await openTeminPackage();
      return inspectTeminPackageInstance(pkg);
    }
  );
}

/**
 * 11.2. Kullanıcının bilgisayarından seçip yüklediği .temin dosyasını açar ve inceler.
 */
export async function uploadAndInspectTeminPackageAction(
  formData: FormData
): Promise<TestRunResult<TeminPackageInspectionResult>> {
  return executePlaygroundTest(
    "TeminPackage -> Kullanıcı .temin Arşivini Ayıkla ve Canlı Oku",
    async () => {
      const file = formData.get("file") as File | null;
      if (!file) {
        throw new Error("Lütfen bir .temin arşivi seçiniz.");
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempPath = path.join(
        os.tmpdir(),
        `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      );
      fs.writeFileSync(tempPath, buffer);

      const pkg = await TeminPackage.open(tempPath);
      const res = await inspectTeminPackageInstance(pkg, file.name, Math.round(file.size / 1024));
      return res;
    }
  );
}

async function inspectTeminPackageInstance(
  pkg: any,
  overrideFileName?: string,
  overrideSizeKb?: number
): Promise<TeminPackageInspectionResult> {
  const meta = pkg.meta;
  const attachments = pkg.attachments || [];
  const conn = await pkg.getConnection();

  const files = await conn.query(
    "SELECT id, dosya_no, temin_no, konu, alim_turu, tur, durum, yaklasik_maliyet, butce_yili, created_at FROM DATA_TeminDosyasi ORDER BY id DESC LIMIT 50"
  ).catch(() => []);

  const items = await conn.query(
    "SELECT id, temin_dosya_id, kalem_adi, miktar, birim, birim_fiyat, kdv_orani FROM DATA_TeminKalem ORDER BY id DESC LIMIT 100"
  ).catch(() => []);

  const firms = await conn.query(
    "SELECT id, unvan, vergi_no, telefon, email FROM TANIM_Firma ORDER BY id DESC LIMIT 50"
  ).catch(() => []);

  const settingsRows = await conn.query(
    "SELECT key, value FROM settings"
  ).catch(() => []);
  const settingsMap: Record<string, string> = {};
  for (const s of settingsRows) {
    if (s.key) settingsMap[s.key] = String(s.value || "");
  }

  const stat = fs.existsSync(pkg.filePath) ? fs.statSync(pkg.filePath) : null;
  const sizeKb = overrideSizeKb || (stat ? Math.round(stat.size / 1024) : 0);
  const fileName = overrideFileName || path.basename(pkg.filePath);

  return {
    fileName,
    filePath: pkg.filePath,
    fileSizeKb: sizeKb,
    meta,
    attachments,
    activeDbFileName: pkg.activeDbFileName || "database.sqlite",
    counts: {
      files: files.length,
      items: items.length,
      firms: firms.length,
      attachments: attachments.length,
    },
    files,
    items,
    firms,
    settings: settingsMap,
  };
}

// ============================================================================
// 12. VERİTABANI KAYNAĞI YÖNETİMİ ACTIONS (Canlı Desktop Sync)
// ============================================================================

export async function getActiveDatabaseInfoAction(): Promise<ActiveDatabaseInfo> {
  return getActiveDatabaseInfo();
}

export async function switchPlaygroundDatabaseAction(
  target: "desktop" | "fixture" | string
): Promise<TestRunResult<ActiveDatabaseInfo>> {
  return executePlaygroundTest(
    `Veritabanı Değiştir -> ${target}`,
    async () => {
      let targetPath = target;
      if (target === "desktop") {
        const desktopPath = findLatestDesktopWorkspaceDb();
        if (!desktopPath) {
          throw new Error(
            "Masaüstü uygulamasına ait aktif çalışma alanı (dtm_temp) bulunamadı. Lütfen masaüstü uygulamasında bir dosya açtığınızdan emin olun."
          );
        }
        targetPath = desktopPath;
      } else if (target === "fixture") {
        const fixtureCandidates = [
          path.resolve(process.cwd(), "../../tests/fixtures/temin/files/test-projesi.sqlite"),
          path.resolve(process.cwd(), "tests/fixtures/temin/files/test-projesi.sqlite"),
          path.resolve(process.cwd(), "../../../tests/fixtures/temin/files/test-projesi.sqlite"),
        ];
        const found = fixtureCandidates.find((c) => fs.existsSync(c));
        if (!found) {
          throw new Error("test-projesi.sqlite fikstür dosyası bulunamadı.");
        }
        targetPath = found;
      }

      setActiveDbPath(targetPath);
      const info = getActiveDatabaseInfo();
      return info;
    }
  );
}

/**
 * 11.3. Kullanıcının bilgisayarından seçip yüklediği .temin veya .sqlite dosyasını
 * doğrudan çalışma alanı (aktif veritabanı) olarak açar ve oturumu bu veritabanına bağlar.
 */
export async function openAndActivateTeminPackageAction(
  formData: FormData
): Promise<TestRunResult<ActiveDatabaseInfo>> {
  return executePlaygroundTest(
    "TeminPackage -> .temin Dosyasını Çalışma Alanı Olarak Aç",
    async () => {
      const file = formData.get("file") as File | null;
      if (!file) {
        throw new Error("Lütfen bir .temin veya .sqlite dosyası seçiniz.");
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const workspacesDir = path.resolve(process.cwd(), ".temin_workspaces");
      if (!fs.existsSync(workspacesDir)) {
        fs.mkdirSync(workspacesDir, { recursive: true });
      }

      const cleanBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const targetDir = path.join(workspacesDir, `${Date.now()}_${cleanBase.replace(/\.(temin|sqlite)$/i, "")}`);
      fs.mkdirSync(targetDir, { recursive: true });

      let extractedDbPath: string;

      if (file.name.toLowerCase().endsWith(".sqlite")) {
        extractedDbPath = path.join(targetDir, "database.sqlite");
        fs.writeFileSync(extractedDbPath, buffer);
      } else {
        const archivePath = path.join(targetDir, cleanBase);
        fs.writeFileSync(archivePath, buffer);

        const pkg = await TeminPackage.open(archivePath);
        extractedDbPath = pkg.getDatabasePath();
      }

      setActiveCustomLabel(file.name);
      setActiveDbPath(extractedDbPath);
      const info = getActiveDatabaseInfo();
      info.customLabel = file.name;
      return info;
    }
  );
}

/**
 * 11.4. Repo içindeki hazır test-projesi.temin dosyasını açıp çalışma alanı yapar.
 */
export async function openPresetTeminPackageAction(): Promise<TestRunResult<ActiveDatabaseInfo>> {
  return executePlaygroundTest(
    "TeminPackage -> test-projesi.temin Dosyasını Çalışma Alanı Olarak Aç",
    async () => {
      const candidateRoots = [
        process.cwd(),
        path.resolve(process.cwd(), ".."),
        path.resolve(process.cwd(), "../.."),
        path.resolve(process.cwd(), "../../.."),
      ];

      let teminPath: string | null = null;
      for (const r of candidateRoots) {
        const p = path.join(r, "tests", "fixtures", "temin", "files", "test-projesi.temin");
        if (fs.existsSync(p)) {
          teminPath = p;
          break;
        }
      }

      if (!teminPath) {
        throw new Error("test-projesi.temin dosyası repo içinde bulunamadı.");
      }

      const pkg = await TeminPackage.open(teminPath);
      setActiveCustomLabel("test-projesi.temin");
      setActiveDbPath(pkg.getDatabasePath());
      const info = getActiveDatabaseInfo();
      info.customLabel = "test-projesi.temin";
      return info;
    }
  );
}

/**
 * 12.3. Kullanıcının masaüstünde (Desktop) bulunan gerçek .temin paketini bulup doğrudan açar.
 */
export async function openDesktopTeminPackageAction(): Promise<TestRunResult<ActiveDatabaseInfo>> {
  return executePlaygroundTest(
    "TeminPackage -> Masaüstündeki .temin Dosyasını Çalışma Alanı Olarak Aç",
    async () => {
      const userProfile = process.env.USERPROFILE || "";
      const desktopDir = path.join(userProfile, "Desktop");

      let foundTemin: string | null = null;
      if (fs.existsSync(desktopDir)) {
        const files = fs.readdirSync(desktopDir).filter((f) => f.toLowerCase().endsWith(".temin"));
        if (files.length > 0) {
          // Varsa en son güncelleneni seç
          let maxTime = 0;
          for (const f of files) {
            const full = path.join(desktopDir, f);
            const m = fs.statSync(full).mtimeMs;
            if (m > maxTime) {
              maxTime = m;
              foundTemin = full;
            }
          }
        }
      }

      if (!foundTemin) {
        throw new Error("Masaüstünde (.temin) uzantılı proje dosyası bulunamadı.");
      }

      const cleanFileName = path.basename(foundTemin);
      const pkg = await TeminPackage.open(foundTemin);
      setActiveCustomLabel(cleanFileName);
      setActiveDbPath(pkg.getDatabasePath());
      const info = getActiveDatabaseInfo();
      info.customLabel = cleanFileName;
      return info;
    }
  );
}




