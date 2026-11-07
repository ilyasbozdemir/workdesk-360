import { beforeEach, describe, expect, it } from "vitest";
import { DocumentEngine } from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";
import {
  createInMemoryStorageAdapter,
  createSyntheticDocumentData,
  SYNTHETIC_HEADER_DATA,
} from "../../__tests__/fixtures";

describe("Piyasa Fiyat Araştırma Tutanağı — Snapshot ve Refresh Testleri", () => {
  const storageAdapter = createInMemoryStorageAdapter();

  beforeEach(() => {
    storageAdapter.getRawStore().clear();
    registerTeminTemplates();
    DocumentEngine.setStorageAdapter(storageAdapter);
    DocumentEngine.setHeaderResolver(async () => ({ ...SYNTHETIC_HEADER_DATA }));
    DocumentEngine.setQueryExecutor(async () => []);
  });

  it("kaydedilen piyasa fiyat tutanağı snapshot verisi yeniden açıldığında ve senkronize edildiğinde korunur", async () => {
    const customSnapshot = createSyntheticDocumentData({
      aciklama: "Piyasa fiyat araştırması 4734/22-d kapsamında yapılmıştır (Manuel Not).",
      baskanAdi: "Özel Onay Makamı",
    });

    await DocumentEngine.saveDocument({
      dosyaId: 202,
      templateKey: "piyasa-fiyat-arastirma-tutanagi",
      data: customSnapshot,
    });

    const loaded = await DocumentEngine.loadOrCreateDocument<any>({
      dosyaId: 202,
      templateKey: "piyasa-fiyat-arastirma-tutanagi",
    });

    expect(loaded.isExisting).toBe(true);
    expect(loaded.data.aciklama).toBe(
      "Piyasa fiyat araştırması 4734/22-d kapsamında yapılmıştır (Manuel Not).",
    );
    expect(loaded.data.baskanAdi).toBe("Özel Onay Makamı");

    const synced = await DocumentEngine.syncWithSource<any>({
      dosyaId: 202,
      templateKey: "piyasa-fiyat-arastirma-tutanagi",
      existingData: loaded.data,
    });

    expect(synced.data.aciklama).toBe(
      "Piyasa fiyat araştırması 4734/22-d kapsamında yapılmıştır (Manuel Not).",
    );
    expect(synced.data.baskanAdi).toBe("Özel Onay Makamı");
  });
});

