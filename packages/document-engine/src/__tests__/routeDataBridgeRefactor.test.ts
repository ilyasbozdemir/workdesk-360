import { describe, expect, it } from "vitest";
import type {
  ResolvedDocumentRoute,
  TemplateRouteDefinition,
} from "../route/types";
import {
  applyResolvedRouteToDocumentData,
  extractDocumentRouteValues,
} from "../route/routeDataBridge";

describe("routeDataBridge Refactor — Şablondan Bağımsız Açık Sözleşme ve Rol Ayrımı", () => {
  it("onaylayan alanını baskanAdi veya harcamaYetkilisiAdi ile OTOMATİK EŞİTLEMEZ", () => {
    // Şablon sözleşmesinde baskanAdi veya harcamaYetkilisiAdi açıkça bağlanmamışsa yazılmamalıdır
    const testRoute: ResolvedDocumentRoute = {
      templateId: "ozel-talep-formu",
      definitionVersion: 1,
      steps: [
        {
          id: "onaylayan",
          label: "Onaylayan Yetkili",
          kind: "person",
          defaultSource: "settings",
          fieldKey: "onaylayanPersonelAdi",
          titleFieldKey: "onaylayanPersonelUnvan",
          value: {
            id: "p1",
            name: "Selin YILMAZ",
            title: "Şube Müdürü",
          },
          origin: "settings",
        },
      ],
    };

    const initialDoc: Record<string, any> = {
      belgeTuru: "ozel-talep-formu",
    };

    const result = applyResolvedRouteToDocumentData(initialDoc, testRoute);

    // Birincil alan yazılmalı
    expect(result.onaylayanPersonelAdi).toBe("Selin YILMAZ");
    expect(result.onaylayanPersonelUnvan).toBe("Şube Müdürü");

    // Otomatik kopyalama yapılmamalıdır!
    expect(result.baskanAdi).toBeUndefined();
    expect(result.baskanUnvan).toBeUndefined();
    expect(result.harcamaYetkilisiAdi).toBeUndefined();
    expect(result.harcamaYetkilisiUnvan).toBeUndefined();
  });

  it("yalnızca şablon sözleşmesinde açıkça targetFieldKeys tanımlanmışsa ilgili alanlara yazar", () => {
    const testRouteWithTargets: ResolvedDocumentRoute = {
      templateId: "onay-belgesi-ozel",
      definitionVersion: 1,
      steps: [
        {
          id: "onaylayan",
          label: "Harcama Yetkilisi",
          kind: "person",
          defaultSource: "settings",
          fieldKey: "onaylayanPersonelAdi",
          titleFieldKey: "onaylayanPersonelUnvan",
          targetFieldKeys: ["harcamaYetkilisiAdi"],
          targetTitleFieldKeys: ["harcamaYetkilisiUnvan"],
          value: {
            id: "p2",
            name: "Ahmet KAYA",
            title: "Harcama Yetkilisi",
          },
          origin: "settings",
        },
      ],
    };

    const result = applyResolvedRouteToDocumentData<Record<string, any>>(
      {},
      testRouteWithTargets,
    );

    expect(result.onaylayanPersonelAdi).toBe("Ahmet KAYA");
    expect(result.harcamaYetkilisiAdi).toBe("Ahmet KAYA");
    expect(result.onaylayanPersonelUnvan).toBe("Harcama Yetkilisi");
    expect(result.harcamaYetkilisiUnvan).toBe("Harcama Yetkilisi");

    // baskanAdi açıkça targetFieldKeys'te yer almadığı için yazılmamalıdır
    expect(result.baskanAdi).toBeUndefined();
  });

  it("extractDocumentRouteValues, baskanAdi'nı onaylayan olarak otomatik çekmez", () => {
    const strictDefinition: TemplateRouteDefinition = {
      templateId: "ihtiyac-listesi",
      version: 1,
      slots: [
        {
          id: "onaylayan",
          label: "Onaylayan",
          kind: "person",
          defaultSource: "settings",
          fieldKey: "onaylayanPersonelAdi",
          titleFieldKey: "onaylayanPersonelUnvan",
          sourceFieldKeys: ["onaylayanPersonelAdi"], // baskanAdi veya harcamaYetkilisiAdi YOK
        },
      ],
    };

    const docWithOnlyBaskan: Record<string, any> = {
      baskanAdi: "Komisyon Başkanı Ali",
      baskanUnvan: "Başkan Unvan",
    };

    const extracted = extractDocumentRouteValues(
      docWithOnlyBaskan,
      strictDefinition,
    );

    // baskanAdi, onaylayan alanına sızmamalıdır!
    expect(extracted.onaylayan).toBeNull();
  });

  it("isAppointmentDocument contract bayrağına göre yedek üye filtrelemesini şablon ID stringine bakmaksızın yönetir", () => {
    const members = [
      {
        id: "m1",
        name: "Asil Üye 1",
        title: "Mühendis",
        role: "Üye",
        asilMi: 1,
        imzaTuru: "İmza" as const,
      },
      {
        id: "m2",
        name: "Yedek Üye 1",
        title: "Mimar",
        role: "Yedek Üye",
        asilMi: 0,
        imzaTuru: "İmza" as const,
        aktifKatilim: false,
      },
    ];

    // 1) Standart belge (isAppointmentDocument === false): Yedek üye elenmeli
    const standardRoute: ResolvedDocumentRoute = {
      templateId: "herhangi-bir-tutanak",
      definitionVersion: 1,
      isAppointmentDocument: false,
      steps: [
        {
          id: "komisyon",
          label: "Komisyon",
          kind: "person-list",
          defaultSource: "document",
          fieldKey: "komisyonUyeleri",
          value: members,
          origin: "document",
        },
      ],
    };

    const standardDoc = applyResolvedRouteToDocumentData<Record<string, any>>(
      {},
      standardRoute,
    );
    expect(standardDoc.komisyonUyeleri).toHaveLength(1);
    expect(standardDoc.komisyonUyeleri[0].adSoyad).toBe("Asil Üye 1");

    // 2) Görevlendirme belgesi (isAppointmentDocument === true): Yedek üye dahil edilmeli
    const appointmentRoute: ResolvedDocumentRoute = {
      templateId: "herhangi-bir-belge",
      definitionVersion: 1,
      isAppointmentDocument: true,
      steps: [
        {
          id: "komisyon",
          label: "Komisyon",
          kind: "person-list",
          defaultSource: "document",
          fieldKey: "komisyonUyeleri",
          value: members,
          origin: "document",
        },
      ],
    };

    const appointmentDoc = applyResolvedRouteToDocumentData<
      Record<string, any>
    >({}, appointmentRoute);
    expect(appointmentDoc.komisyonUyeleri).toHaveLength(2);
    expect(appointmentDoc.komisyonUyeleri[1].adSoyad).toBe("Yedek Üye 1");
  });

  it("targetFieldKeys ile komisyon üyelerini ek alanlara (fiyatKomisyonu, komisyon vb.) açıkça eşler", () => {
    const route: ResolvedDocumentRoute = {
      templateId: "piyasa-fiyat-tutanak",
      definitionVersion: 1,
      steps: [
        {
          id: "komisyon",
          label: "Araştırma Görevlileri",
          kind: "person-list",
          defaultSource: "document",
          fieldKey: "fiyatArastirmaGorevlileri",
          targetFieldKeys: ["komisyon", "fiyatKomisyonu"],
          value: [
            {
              id: "p1",
              name: "Memur Can",
              title: "Memur",
              role: "Üye",
              imzaTuru: "İmza",
              asilMi: 1,
            },
          ],
          origin: "document",
        },
      ],
    };

    const doc = applyResolvedRouteToDocumentData<Record<string, any>>(
      {},
      route,
    );
    expect(doc.fiyatArastirmaGorevlileri).toHaveLength(1);
    expect(doc.komisyon).toHaveLength(1);
    expect(doc.fiyatKomisyonu).toHaveLength(1);
    expect(doc.fiyatArastirmaGorevlileri[0].adSoyad).toBe("Memur Can");
  });
});
