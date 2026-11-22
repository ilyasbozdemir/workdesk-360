import { describe, expect, it } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { TeminPackage } from "../../src/database/temin/TeminPackage";

describe("TeminPackage (.temin arşivi ve SQLite veritabanı ayıklayıcı)", () => {
  const teminFilePath = path.resolve(
    __dirname,
    "../../../../tests/fixtures/temin/files/test-projesi.temin",
  );

  it(".temin dosyasını açıp meta.json ve veritabanı yolunu eksiksiz sağlamalıdır", async () => {
    expect(fs.existsSync(teminFilePath)).toBe(true);

    const pkg = await TeminPackage.open(teminFilePath);

    try {
      expect(pkg.filePath).toBe(teminFilePath);
      expect(pkg.activeDbFileName).toBe("database.sqlite");
      expect(pkg.meta).toBeDefined();
      expect(pkg.meta.institution).toBeDefined();

      const dbPath = pkg.getDatabasePath();
      expect(fs.existsSync(dbPath)).toBe(true);
      expect(dbPath.endsWith("database.sqlite")).toBe(true);

      const prismaUrl = pkg.getPrismaDatasourceUrl();
      expect(prismaUrl.startsWith("file:")).toBe(true);

      const conn = await pkg.getConnection();
      const rows = await conn.query<{ key: string; value: string }>(
        "SELECT key, value FROM settings WHERE key IN ('adminUsername', 'institutionName')",
      );
      const settingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

      expect(settingsMap["adminUsername"]).toBe("Acme");
      expect(settingsMap["institutionName"]).toBe("Acme Corporation");
    } finally {
      await pkg.close();
    }
  });
});
