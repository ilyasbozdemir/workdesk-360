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

export function getDatabaseSyncClass(): any {
  if (DatabaseSyncClass) return DatabaseSyncClass;
  try {
    if (typeof (process as any).getBuiltinModule === "function") {
      const mod = (process as any).getBuiltinModule("node:sqlite");
      if (mod?.DatabaseSync) {
        DatabaseSyncClass = mod.DatabaseSync;
        return DatabaseSyncClass;
      }
    }
  } catch {}

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createRequire } = require("node:module");
    const req = createRequire(process.cwd());
    const mod = req("node:sqlite");
    if (mod?.DatabaseSync) {
      DatabaseSyncClass = mod.DatabaseSync;
      return DatabaseSyncClass;
    }
  } catch {}

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("node:sqlite");
    if (mod?.DatabaseSync) {
      DatabaseSyncClass = mod.DatabaseSync;
      return DatabaseSyncClass;
    }
  } catch {}

  return null;
}

let activeDbInstance: any = null;
let activeDbPath: string | null = null;
let activeCustomLabel: string | null = null;

export function setActiveCustomLabel(label: string | null): void {
  activeCustomLabel = label;
}

function getConfigFilePath(): string {
  const rootCandidate = path.resolve(process.cwd(), ".active-playground-db.json");
  const subCandidate = path.resolve(process.cwd(), "apps", "core-playground", ".active-playground-db.json");
  if (fs.existsSync(subCandidate)) return subCandidate;
  if (fs.existsSync(rootCandidate)) return rootCandidate;
  return rootCandidate;
}

/**
 * Kullanıcının masaüstü uygulamasında (Temin 360 Desktop / Electron)
 * şu an açık olan en son çalışma alanı veritabanını otomatik tespit eder.
 */
export function findLatestDesktopWorkspaceDb(): string | null {
  try {
    const appData = process.env.APPDATA || "";
    const dirs = [
      path.join(appData, "temin360-desktop", "dtm_temp"),
      path.join(appData, "temin360-desktop-dev", "dtm_temp"),
      path.join(appData, "dt-asistan-desktop-app", "dtm_temp"),
    ];
    let newest: string | null = null;
    let maxTime = 0;
    for (const d of dirs) {
      if (!fs.existsSync(d)) continue;
      for (const sub of fs.readdirSync(d)) {
        const dbFile = path.join(d, sub, "database.sqlite");
        if (fs.existsSync(dbFile)) {
          const m = fs.statSync(dbFile).mtimeMs;
          if (m > maxTime) {
            maxTime = m;
            newest = dbFile;
          }
        }
      }
    }
    return newest;
  } catch {
    return null;
  }
}

export function getSavedActiveDbPath(): string | null {
  try {
    const cfg = getConfigFilePath();
    if (fs.existsSync(cfg)) {
      const content = fs.readFileSync(cfg, "utf-8");
      const data = JSON.parse(content);
      if (data?.path && (data.path === ":memory:" || fs.existsSync(data.path))) {
        return data.path;
      }
    }
  } catch {}
  return null;
}

export function saveActiveDbPath(filePath: string): void {
  try {
    const cfg = getConfigFilePath();
    fs.writeFileSync(
      cfg,
      JSON.stringify({ path: filePath, updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch {}
}

export function setActiveDbPath(filePath: string): boolean {
  if (filePath !== ":memory:" && !fs.existsSync(filePath)) {
    throw new Error(`Veritabanı dosyası bulunamadı: ${filePath}`);
  }
  resetPlaygroundDb();
  saveActiveDbPath(filePath);
  activeDbPath = filePath;
  getPlaygroundRawDb();
  return true;
}

function resolveFixtureDbPath(): string | null {
  // 1. Masaüstü uygulamasının çalışmakta olduğu aktif oturum (Auto-detect önceliği)
  const desktopDb = findLatestDesktopWorkspaceDb();
  const saved = getSavedActiveDbPath();

  // Kullanıcı masaüstü dışı bir fikstür kaydetmişse onu kullan
  if (saved && fs.existsSync(saved)) {
    return saved;
  }

  // Masaüstü oturumu açıksa doğrudan masaüstüne bağlan
  if (desktopDb && fs.existsSync(desktopDb)) {
    saveActiveDbPath(desktopDb);
    return desktopDb;
  }

  // 3. Repo içi fikstür dosyası
  const searchRoots = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
    path.resolve(process.cwd(), "../../.."),
  ];

  for (const root of searchRoots) {
    const sqlitePath = path.join(root, "tests", "fixtures", "temin", "files", "test-projesi.sqlite");
    if (fs.existsSync(sqlitePath)) {
      saveActiveDbPath(sqlitePath);
      return sqlitePath;
    }
    const teminPath = path.join(root, "tests", "fixtures", "temin", "files", "test-projesi.temin");
    if (fs.existsSync(teminPath)) {
      const extracted = teminPath.replace(/\.temin$/, ".sqlite");
      if (!fs.existsSync(extracted)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const cp = require("node:child_process");
          cp.execSync(`tar -xf "${teminPath}" database.sqlite`, {
            cwd: path.dirname(teminPath),
          });
          const defaultDb = path.join(path.dirname(teminPath), "database.sqlite");
          if (fs.existsSync(defaultDb)) {
            fs.renameSync(defaultDb, extracted);
          }
        } catch {}
      }
      if (fs.existsSync(extracted)) {
        saveActiveDbPath(extracted);
        return extracted;
      }
    }
  }

  // Fallback to local files
  const localCandidates = [
    path.resolve(process.cwd(), "test-projesi.sqlite"),
    path.resolve(process.cwd(), "tests/fixtures/temin/files/test-projesi.sqlite"),
  ];
  for (const c of localCandidates) {
    if (fs.existsSync(c)) {
      saveActiveDbPath(c);
      return c;
    }
  }
  return null;
}

function createInMemoryFallback() {
  const playgroundItems = new Map<
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

  const teminFiles = new Map<number, any>([
    [1, {
      id: 1,
      dosya_no: "2026/1",
      temin_no: "2026/1",
      konu: "Acme Sunucu ve Donanım Alımı",
      ihale_tipi: "mal",
      tur: "mal",
      alim_turu: "mal",
      durum: "taslak",
      butce_yili: 2026,
      yaklasik_maliyet: 125000,
      is_deleted: 0,
      created_at: new Date().toISOString(),
    }],
    [2, {
      id: 2,
      dosya_no: "2026/2",
      temin_no: "2026/2",
      konu: "Yazılım ve Bulut Hizmeti Alımı",
      ihale_tipi: "hizmet",
      tur: "hizmet",
      alim_turu: "hizmet",
      durum: "taslak",
      butce_yili: 2026,
      yaklasik_maliyet: 85000,
      is_deleted: 0,
      created_at: new Date().toISOString(),
    }],
  ]);

  const teminItems = new Map<number, any>();
  const teminOffers = new Map<number, any>();
  let nextItemId = 1;
  let nextOfferId = 1;

  const settingsMap = new Map<string, string>([
    ["adminUsername", "Acme"],
    ["adminName", "Acme"],
    ["institutionName", "Acme Corporation"],
  ]);

  return {
    exec: (_sql: string) => {},
    prepare: (sql: string) => ({
      get: (...params: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.includes("count(*)")) {
          if (lower.includes("data_temindosyasi")) {
            return { cnt: Array.from(teminFiles.values()).filter((f) => f.is_deleted === 0).length };
          }
          if (lower.includes("data_teminkalem")) {
            return { cnt: Array.from(teminItems.values()).filter((i) => i.is_deleted === 0).length };
          }
          if (lower.includes("data_teminfirma")) {
            return { cnt: Array.from(teminOffers.values()).filter((o) => o.is_deleted === 0).length };
          }
          return { cnt: playgroundItems.size };
        }
        return null;
      },
      all: (...params: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.includes("is_alive")) {
          return [{ is_alive: 1, server_time: new Date().toISOString() }];
        }

        // 1. DATA_TeminDosyasi sorguları
        if (lower.includes("data_temindosyasi")) {
          if (lower.includes("count(*)")) {
            const idMatch = sql.match(/id\s*=\s*['"]?(\d+)['"]?/i) || params[0];
            const checkId = idMatch ? Number(idMatch) : null;
            if (checkId !== null && !isNaN(checkId)) {
              const has = teminFiles.has(checkId) && teminFiles.get(checkId)?.is_deleted === 0;
              return [{ count: has ? 1 : 0, cnt: has ? 1 : 0 }];
            }
            const activeCount = Array.from(teminFiles.values()).filter((f) => f.is_deleted === 0).length;
            return [{ count: activeCount, cnt: activeCount }];
          }

          if (lower.includes("where id =") || lower.includes("where id=?")) {
            const id = Number(params[0] || (sql.match(/id\s*=\s*['"]?(\d+)['"]?/i)?.[1]));
            const found = teminFiles.get(id);
            return found && found.is_deleted === 0 ? [found] : [];
          }

          const allActive = Array.from(teminFiles.values()).filter((f) => f.is_deleted === 0);
          return allActive;
        }

        // 2. DATA_TeminKalem sorguları
        if (lower.includes("data_teminkalem")) {
          if (lower.includes("count(*)")) {
            const count = Array.from(teminItems.values()).filter((it) => it.is_deleted === 0).length;
            return [{ count, cnt: count }];
          }
          const fileId = Number(params[0] || (sql.match(/(?:temin_dosya_id|dosya_id)\s*=\s*['"]?(\d+)['"]?/i)?.[1]));
          const activeItems = Array.from(teminItems.values()).filter((it) => {
            if (it.is_deleted !== 0 && it.is_deleted !== null && it.is_deleted !== undefined) return false;
            if (fileId && it.temin_dosya_id !== fileId && it.dosya_id !== fileId) return false;
            return true;
          });
          return activeItems;
        }

        // 3. DATA_TeminFirma sorguları
        if (lower.includes("data_teminfirma")) {
          if (lower.includes("count(*)")) {
            const count = Array.from(teminOffers.values()).filter((o) => o.is_deleted === 0).length;
            return [{ count, cnt: count }];
          }
          const fileId = Number(params[0] || (sql.match(/(?:temin_dosya_id|dosya_id)\s*=\s*['"]?(\d+)['"]?/i)?.[1]));
          const activeOffers = Array.from(teminOffers.values()).filter((o) => {
            if (o.is_deleted !== 0 && o.is_deleted !== null && o.is_deleted !== undefined) return false;
            if (fileId && o.temin_dosya_id !== fileId && o.dosya_id !== fileId) return false;
            return true;
          });
          return activeOffers;
        }

        // 4. settings tablosu sorguları
        if (lower.includes("from settings")) {
          const result: Array<{ key: string; value: string }> = [];
          for (const [k, v] of settingsMap.entries()) {
            result.push({ key: k, value: v });
          }
          return result;
        }

        // 5. Genel / playground_items sorguları
        if (lower.includes("count(*)")) {
          return [{ toplam: playgroundItems.size, target_app: "temin360-desktop" }];
        }
        const items = Array.from(playgroundItems.values());
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
        // DATA_TeminDosyasi insert / update
        if (lower.includes("data_temindosyasi")) {
          if (lower.startsWith("insert into")) {
            const newId = teminFiles.size + 1;
            teminFiles.set(newId, {
              id: newId,
              temin_no: params[0] || `2026/${newId}`,
              dosya_no: params[0] || `2026/${newId}`,
              konu: params[1] || "Yeni Doğrudan Temin",
              yaklasik_maliyet: Number(params[2] || 50000),
              tur: params[3] || "mal",
              ihale_tipi: params[3] || "mal",
              alim_turu: params[3] || "mal",
              butce_yili: Number(params[4] || 2026),
              durum: params[5] || "taslak",
              is_deleted: 0,
              created_at: new Date().toISOString(),
            });
            return { changes: 1, lastInsertRowid: newId, lastInsertRowId: newId };
          }
          if (lower.startsWith("update")) {
            return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
          }
          return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
        }

        // DATA_TeminKalem insert
        if (lower.includes("data_teminkalem")) {
          if (lower.startsWith("insert into")) {
            const id = nextItemId++;
            teminItems.set(id, {
              id,
              temin_dosya_id: params[0] || 1,
              dosya_id: params[1] || params[0] || 1,
              kalem_adi: params[2] || "Kalem",
              miktar: Number(params[3] || 1),
              birim: params[4] || "Adet",
              birim_fiyat: Number(params[5] || 0),
              kdv_orani: Number(params[6] || 20),
              is_deleted: 0,
              created_at: new Date().toISOString(),
            });
            return { changes: 1, lastInsertRowid: id, lastInsertRowId: id };
          }
          return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
        }

        // DATA_TeminFirma insert
        if (lower.includes("data_teminfirma")) {
          if (lower.startsWith("insert into")) {
            const id = nextOfferId++;
            teminOffers.set(id, {
              id,
              temin_dosya_id: params[0] || 1,
              dosya_id: params[1] || params[0] || 1,
              firma_id: params[2] || id,
              unvan: params[3] || "Firma",
              vergi_no: params[4] || "1111111111",
              teklif_toplami: Number(params[5] || 0),
              teklif_verdi_mi: 1,
              kazandi_mi: 0,
              kazanan_mi: 0,
              teklif_durumu: "Teklif Alındı",
              is_deleted: 0,
              created_at: new Date().toISOString(),
            });
            return { changes: 1, lastInsertRowid: id, lastInsertRowId: id };
          }
          if (lower.startsWith("update")) {
            return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
          }
          return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
        }

        // playground_items
        if (lower.startsWith("insert into playground_items") || lower.startsWith("insert into")) {
          const id = params[0] || `item-${Date.now()}`;
          const name = params[1] || "New Item";
          const target_app = params[2] || "temin360-desktop";
          playgroundItems.set(id, {
            id,
            name,
            target_app,
            created_at: new Date().toISOString(),
          });
          return { changes: 1, lastInsertRowid: playgroundItems.size, lastInsertRowId: playgroundItems.size };
        }
        if (lower.startsWith("update")) {
          const name = params[0];
          const id = params[1];
          const item = playgroundItems.get(id);
          if (item) {
            item.name = name;
            return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
          }
          return { changes: 0, lastInsertRowid: 0, lastInsertRowId: 0 };
        }
        if (lower.startsWith("delete from")) {
          if (lower.includes("like 'tx_%'")) {
            for (const key of Array.from(playgroundItems.keys())) {
              if (key.startsWith("tx_")) playgroundItems.delete(key);
            }
            return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
          }
          const id = params[0] ||
            (sql.match(/id\s*=\s*['"]([^'"]+)['"]/i)?.[1]);
          const deleted = id ? playgroundItems.delete(id) : false;
          return { changes: deleted ? 1 : 0, lastInsertRowid: 0, lastInsertRowId: 0 };
        }
        return { changes: 1, lastInsertRowid: 0, lastInsertRowId: 0 };
      },
    }),
    close: () => {
      playgroundItems.clear();
      teminFiles.clear();
      teminItems.clear();
      teminOffers.clear();
      settingsMap.clear();
    },
  };
}

export function getPlaygroundRawDb() {
  if (!activeDbInstance) {
    try {
      const SyncClass = getDatabaseSyncClass();
      if (SyncClass) {
        const fixtureDb = resolveFixtureDbPath();
        if (fixtureDb && fixtureDb !== ":memory:" && fs.existsSync(fixtureDb)) {
          activeDbInstance = new SyncClass(fixtureDb);
          activeDbPath = fixtureDb;
          console.log("[playgroundDb] SQLite veritabanına bağlanıldı:", fixtureDb);
        } else {
          activeDbInstance = new SyncClass(":memory:");
          activeDbPath = ":memory:";
          console.log("[playgroundDb] SQLite :memory: modunda başlatıldı");
        }

        // WAL modu ve bağlantı performansı
        try {
          activeDbInstance.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
          `);
        } catch {}

        // 1. Ensure playground_items exists
        try {
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
        } catch (e) {
          console.warn("[playgroundDb] playground_items table init:", e);
        }

        // 2. Ensure settings table exists before inserting
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const crypto = require("node:crypto");
          const salt = crypto.randomBytes(16).toString("hex");
          const hash = crypto.scryptSync("AcmeAcme", salt, 64).toString("hex");
          const passwordHash = `scrypt$${salt}$${hash}`;

          activeDbInstance.exec(`
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT
            );
            INSERT OR IGNORE INTO settings (key, value) VALUES ('adminUsername', 'Acme');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('adminPassword', '${passwordHash}');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('adminName', 'Acme');
            INSERT OR IGNORE INTO settings (key, value) VALUES ('institutionName', 'Acme Corporation');
          `);
        } catch (e) {
          console.warn("[playgroundDb] settings init:", e);
        }

        // 3. Ensure Temin tables exist IF NOT EXISTS
        try {
          activeDbInstance.exec(`
            CREATE TABLE IF NOT EXISTS DATA_TeminDosyasi (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              dosya_no TEXT,
              temin_no TEXT,
              evrak_sayisi TEXT,
              konu TEXT NOT NULL,
              ihale_tipi TEXT DEFAULT 'Doğrudan Temin',
              alim_turu TEXT DEFAULT 'mal',
              tur TEXT DEFAULT 'mal',
              durum TEXT DEFAULT 'taslak',
              butce_yili INTEGER DEFAULT 2026,
              butce_turu TEXT DEFAULT 'Öz Bütçe',
              birim_id INTEGER,
              birim_adi TEXT,
              sozlesme_turu TEXT DEFAULT 'Doğrudan Temin',
              yaklasik_maliyet REAL DEFAULT 0,
              teslim_suresi_gun INTEGER DEFAULT 7,
              is_deleted INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS DATA_TeminKalem (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              temin_dosya_id INTEGER NOT NULL,
              dosya_id INTEGER,
              sira_no INTEGER,
              kalem_adi TEXT NOT NULL,
              tipi TEXT DEFAULT 'Mal',
              birim TEXT DEFAULT 'Adet',
              miktar REAL NOT NULL DEFAULT 1,
              birim_fiyat REAL DEFAULT 0,
              kdv_orani REAL DEFAULT 20,
              aciklama TEXT,
              is_deleted INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS TANIM_Firma (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              unvan TEXT NOT NULL,
              vergi_no TEXT,
              telefon TEXT,
              aktif_mi INTEGER DEFAULT 1,
              is_deleted INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS DATA_TeminFirma (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              temin_dosya_id INTEGER NOT NULL,
              dosya_id INTEGER,
              firma_id INTEGER,
              unvan TEXT NOT NULL,
              vergi_no TEXT,
              teklif_toplami REAL DEFAULT 0,
              teklif_verdi_mi INTEGER DEFAULT 1,
              kazandi_mi INTEGER DEFAULT 0,
              kazanan_mi INTEGER DEFAULT 0,
              teklif_durumu TEXT DEFAULT 'Teklif Alındı',
              is_deleted INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO DATA_TeminDosyasi (id, dosya_no, temin_no, konu, ihale_tipi, tur, alim_turu, durum, butce_yili, yaklasik_maliyet, is_deleted)
            VALUES 
              (1, '2026/1', '2026/1', 'Acme Sunucu ve Donanım Alımı', 'Doğrudan Temin', 'mal', 'mal', 'taslak', 2026, 125000, 0),
              (2, '2026/2', '2026/2', 'Yazılım ve Bulut Hizmeti Alımı', 'Doğrudan Temin', 'hizmet', 'hizmet', 'taslak', 2026, 85000, 0)
            ON CONFLICT(id) DO NOTHING;
          `);
        } catch (e) {
          console.warn("[playgroundDb] Temin tables init warning:", e);
        }
      } else {
        console.warn("[playgroundDb] node:sqlite bulunamadı, in-memory fallback kullanılıyor");
        activeDbInstance = createInMemoryFallback();
      }
    } catch (err) {
      console.warn("[playgroundDb] SQLite init warning, falling back to in-memory:", err);
      activeDbInstance = createInMemoryFallback();
    }
  }
  return activeDbInstance;
}

export function getActiveDbPath(): string {
  if (!activeDbPath) getPlaygroundRawDb();
  return activeDbPath || "test-projesi.sqlite (Fixture DB)";
}

export interface ActiveDatabaseInfo {
  path: string;
  source: 'desktop_active' | 'fixture' | 'temin_package' | 'custom' | 'memory';
  isDesktopRunning: boolean;
  detectedDesktopPath: string | null;
  fileCount: number;
  itemCount: number;
  offerCount: number;
  customLabel?: string;
}

export function getActiveDatabaseInfo(): ActiveDatabaseInfo {
  const db = getPlaygroundRawDb();
  const currentPath = activeDbPath || ":memory:";
  const desktopPath = findLatestDesktopWorkspaceDb();

  let source: ActiveDatabaseInfo['source'] = 'custom';
  if (desktopPath && path.resolve(currentPath) === path.resolve(desktopPath)) {
    source = 'desktop_active';
  } else if (currentPath.includes('.temin_workspaces') || (activeCustomLabel && activeCustomLabel.endsWith('.temin'))) {
    source = 'temin_package';
  } else if (currentPath.includes('test-projesi')) {
    source = 'fixture';
  } else if (currentPath === ':memory:') {
    source = 'memory';
  }

  let fileCount = 0;
  let itemCount = 0;
  let offerCount = 0;

  try {
    const fRes = db.prepare("SELECT count(*) as cnt FROM DATA_TeminDosyasi WHERE is_deleted = 0 OR is_deleted IS NULL").get() as any;
    fileCount = Number(fRes?.cnt || 0);
  } catch {}

  try {
    const iRes = db.prepare("SELECT count(*) as cnt FROM DATA_TeminKalem WHERE is_deleted = 0 OR is_deleted IS NULL").get() as any;
    itemCount = Number(iRes?.cnt || 0);
  } catch {}

  try {
    const oRes = db.prepare("SELECT count(*) as cnt FROM DATA_TeminFirma WHERE is_deleted = 0 OR is_deleted IS NULL").get() as any;
    offerCount = Number(oRes?.cnt || 0);
  } catch {}

  return JSON.parse(
    JSON.stringify({
      path: currentPath,
      source,
      isDesktopRunning: Boolean(desktopPath),
      detectedDesktopPath: desktopPath,
      fileCount,
      itemCount,
      offerCount,
      customLabel: activeCustomLabel || undefined,
    })
  );
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

  const conn: IDatabaseConnection = {
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
      const rawRows = stmt.all(...params);
      // Next.js Server Actions gereksinimi: node:sqlite null prototype ([Object: null prototype]) nesneler döndürür.
      // React Server Components serileştirmesi için bunları düz (plain) nesnelere çeviriyoruz.
      return JSON.parse(JSON.stringify(rawRows)) as TResult[];
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
        changes: Number(res.changes || 0),
        lastInsertRowId: Number(
          res.lastInsertRowid ?? res.lastInsertRowId ?? 0,
        ),
      };
    },

    async beginTransaction(): Promise<IDatabaseTransaction> {
      const tx = new PlaygroundDatabaseTransaction(conn);
      await tx.begin();
      return tx;
    },

    async close(): Promise<void> {
      // Bağlantı havuzu uygulama oturumu boyunca açık kalır, resetPlaygroundDb yalnızca açıkça istendiğinde çağrılır
    },
  };

  return conn;
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
