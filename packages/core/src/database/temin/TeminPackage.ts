import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { IDatabaseConnection, DatabaseQueryParameters, DatabaseExecutionResult } from "../contracts/IDatabaseConnection";
import type { ITeminPackage, ITeminMeta, ITeminAttachmentEntry } from "../contracts/ITeminPackage";

/**
 * Node.js 22+ yerleşik node:sqlite veya better-sqlite3 sürücüsünü dinamik yükler.
 */
function createSqliteConnection(sqliteFilePath: string): IDatabaseConnection {
  let dbInstance: any = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require("node:sqlite");
    dbInstance = new DatabaseSync(sqliteFilePath);
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require("better-sqlite3");
      dbInstance = new Database(sqliteFilePath);
    } catch (err) {
      throw new Error(
        `SQLite sürücüsü yüklenemedi (node:sqlite veya better-sqlite3 bulunamadı): ${err}`,
      );
    }
  }

  return {
    async query<TResult = Record<string, unknown>>(
      sql: string,
      parameters?: DatabaseQueryParameters,
    ): Promise<TResult[]> {
      const stmt = dbInstance.prepare(sql);
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
      const stmt = dbInstance.prepare(sql);
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
      if (dbInstance && typeof dbInstance.close === "function") {
        dbInstance.close();
      }
    },
  };
}

/**
 * .temin paket dosyasını temsil eden somut sınıf.
 * Arşiv içerisindeki meta.json ve database.sqlite dosyasını yönetir.
 */
export class TeminPackage implements ITeminPackage {
  public readonly filePath: string;
  public readonly meta: ITeminMeta;
  public readonly activeDbFileName: string;
  public readonly attachments: ITeminAttachmentEntry[] = [];

  private readonly extractedDir: string;
  private readonly extractedDbPath: string;
  private activeConnection: IDatabaseConnection | null = null;

  private constructor(
    filePath: string,
    extractedDir: string,
    meta: ITeminMeta,
    activeDbFileName: string,
    extractedDbPath: string,
    attachments: ITeminAttachmentEntry[],
  ) {
    this.filePath = filePath;
    this.extractedDir = extractedDir;
    this.meta = meta;
    this.activeDbFileName = activeDbFileName;
    this.extractedDbPath = extractedDbPath;
    this.attachments = attachments;
  }

  /**
   * Bir .temin dosyasını açar, doğrular ve ITeminPackage nesnesi olarak döner.
   */
  public static async open(teminFilePath: string): Promise<TeminPackage> {
    const resolvedPath = path.resolve(teminFilePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`.temin dosyası bulunamadı: ${resolvedPath}`);
    }

    const tempDir = path.join(
      os.tmpdir(),
      `temin_pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });

    let AdmZipClass: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      AdmZipClass = require("adm-zip");
    } catch {
      // adm-zip yoksa tar/powershell fallback devreye girer
    }

    let meta: ITeminMeta = {
      project_id: "unknown",
      institution: "Bilinmeyen Kurum",
      active_db_file: "database.sqlite",
    };
    let activeDbFileName = "database.sqlite";
    const attachments: ITeminAttachmentEntry[] = [];

    if (AdmZipClass) {
      const zip = new AdmZipClass(resolvedPath);
      const entries = zip.getEntries();

      // 1. meta.json oku
      const metaEntry = entries.find((e: any) => e.entryName === "meta.json");
      if (metaEntry) {
        try {
          meta = JSON.parse(metaEntry.getData().toString("utf8"));
          if (meta.active_db_file) {
            activeDbFileName = meta.active_db_file;
          }
        } catch {}
      }

      // 2. database.sqlite dosyasını geçici klasöre çıkart
      const dbEntry = entries.find(
        (e: any) => e.entryName === activeDbFileName || e.entryName === "database.sqlite",
      );
      if (!dbEntry) {
        throw new Error(
          `Geçersiz .temin arşivi: ${activeDbFileName} veya database.sqlite bulunamadı.`,
        );
      }
      const targetDbPath = path.join(tempDir, activeDbFileName);
      fs.writeFileSync(targetDbPath, dbEntry.getData());

      // 3. Ek dosyaları tara
      for (const entry of entries) {
        if (
          entry.entryName.startsWith("attachments/") &&
          !entry.isDirectory
        ) {
          attachments.push({
            fileName: path.basename(entry.entryName),
            relativePath: entry.entryName,
            size: entry.header?.size || 0,
          });
        }
      }

      return new TeminPackage(
        resolvedPath,
        tempDir,
        meta,
        activeDbFileName,
        targetDbPath,
        attachments,
      );
    } else {
      // AdmZip yoksa sistem tar / PowerShell ile ayıkla
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cp = require("node:child_process");
      try {
        cp.execSync(`tar -xf "${resolvedPath}" -C "${tempDir}"`, {
          stdio: "ignore",
        });
      } catch {
        // PowerShell Expand-Archive fallback
        cp.execSync(
          `powershell -Command "Expand-Archive -Path '${resolvedPath}' -DestinationPath '${tempDir}' -Force"`,
          { stdio: "ignore" },
        );
      }

      const metaPath = path.join(tempDir, "meta.json");
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
          if (meta.active_db_file) activeDbFileName = meta.active_db_file;
        } catch {}
      }

      const targetDbPath = path.join(tempDir, activeDbFileName);
      if (!fs.existsSync(targetDbPath)) {
        const fallbackDb = path.join(tempDir, "database.sqlite");
        if (fs.existsSync(fallbackDb)) {
          return new TeminPackage(
            resolvedPath,
            tempDir,
            meta,
            "database.sqlite",
            fallbackDb,
            attachments,
          );
        }
        throw new Error(
          `Geçersiz .temin arşivi: ${activeDbFileName} dosyası arşivde bulunamadı.`,
        );
      }

      return new TeminPackage(
        resolvedPath,
        tempDir,
        meta,
        activeDbFileName,
        targetDbPath,
        attachments,
      );
    }
  }

  /**
   * Arşivden ayıklanan SQLite veritabanının disk yolunu döner.
   */
  public getDatabasePath(): string {
    return this.extractedDbPath;
  }

  /**
   * Arşivden ayıklanan SQLite veritabanının binary içeriğini döner.
   */
  public getDatabaseBuffer(): Buffer {
    return fs.readFileSync(this.extractedDbPath);
  }

  /**
   * Prisma ORM datasource bağlantı URL'sini üretir (file:...).
   */
  public getPrismaDatasourceUrl(): string {
    return `file:${this.extractedDbPath}`;
  }

  /**
   * Bu .temin paketinin SQLite veritabanına bağlı canlı IDatabaseConnection bağlantısı döner.
   */
  public async getConnection(): Promise<IDatabaseConnection> {
    if (!this.activeConnection) {
      this.activeConnection = createSqliteConnection(this.extractedDbPath);
    }
    return this.activeConnection;
  }

  /**
   * Kaynakları ve geçici klasörü temizler.
   */
  public async close(): Promise<void> {
    if (this.activeConnection) {
      await this.activeConnection.close();
      this.activeConnection = null;
    }
    try {
      if (fs.existsSync(this.extractedDir)) {
        fs.rmSync(this.extractedDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
