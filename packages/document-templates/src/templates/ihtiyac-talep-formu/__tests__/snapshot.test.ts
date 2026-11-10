import { describe, expect, it } from "vitest";
import { DocumentEngine, TemplateRegistry } from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";

describe("İhtiyaç Talep Formu — Snapshot ve Akıllı Harmanlama Testleri", () => {
  it("veritabanında önceden boş kaydedilmiş snapshot olsa bile taze kalemleri smartMerge ile getirir", async () => {
    TemplateRegistry.clear();
    registerTeminTemplates();

    let savedData: Record<string, unknown> | null = {
      gerekce: "Özel kullanıcı gerekçesi",
      talepEdenPersonelAdi: "Özel Seçilen Personel",
      ihtiyacKalemleri: [], // boş kaydedilmiş
    };

    DocumentEngine.setStorageAdapter({
      async getDocument() {
        return {
          success: true,
          exists: true,
          record: {
            id: 10,
            dosyaId: 1,
            templateKey: "ihtiyac_talep_formu",
            data: savedData!,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      },
      async saveDocument({ data }) {
        savedData = data;
        return { success: true, id: 10 };
      },
      async resetDocument() {
        savedData = null;
        return { success: true };
      },
      async deleteDocument() {
        savedData = null;
        return { success: true };
      },
      async executeQuery(sql: string) {
        if (sql.includes("DATA_TeminKalem")) {
          return [
            {
              id: 1,
              sira_no: 1,
              kalem_adi: "Dizüstü Bilgisayar i7",
              birim: "Adet",
              miktar: 5,
              tasinir_kodu: "255.02.01",
              kdv_orani: 20,
            },
          ];
        }
        return [];
      },
    });

    const docRecord = await DocumentEngine.loadOrCreateDocument({
      dosyaId: 1,
      templateKey: "ihtiyac-talep-formu",
    });

    expect(docRecord.data).toBeDefined();
    // Kullanıcının özel gerekçesi korunmalı
    expect((docRecord.data as any).gerekce).toBe("Özel kullanıcı gerekçesi");
    expect((docRecord.data as any).talepEdenPersonelAdi).toBe("Özel Seçilen Personel");
    // Boş snapshot yerine veritabanındaki taze kalem gelmeli
    expect((docRecord.data as any).ihtiyacKalemleri).toHaveLength(1);
    expect((docRecord.data as any).ihtiyacKalemleri[0].kalemAdi).toBe("Dizüstü Bilgisayar i7");
  });
});
