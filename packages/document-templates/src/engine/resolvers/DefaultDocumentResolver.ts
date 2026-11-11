import {
  DocumentDataResolver,
  DocumentEngine,
  DocumentResolutionContext,
} from "@worksuite-360/document-engine";
import { TemplateResolver } from "../../resolver/TemplateResolver";
import { getTemplateMapping } from "../../registry";

export type ProcessMappingProvider = (processPath: string) => any;

/**
 * @purpose Genel belge veri çözücüsü. Şablonun data.mapping.ts tanımını okuyarak SQLite verilerini derler.
 * @source DATA_TeminDosyasi, DATA_TeminKalem, TANIM_Kurum, TANIM_Personel, DATA_TeminFirma
 * @scope dosyaId, templateKey
 * @usedBy Tüm Temin 360 şablonları (ihtiyac-listesi, ihtiyac-talep-formu, luzum-muzekkeresi vb.)
 * @see packages/document-templates/src/resolver/TemplateResolver.ts
 *
 * Veri çözümleme Document Engine tarafından yürütülür.
 * Şablona özel paralel SQL resolver sınıfları oluşturulmamalıdır.
 */
export class DefaultDocumentResolver
  implements DocumentDataResolver<Record<string, unknown>> {
  private static mappingProvider: ProcessMappingProvider | null = null;

  static setMappingProvider(provider: ProcessMappingProvider | null): void {
    this.mappingProvider = provider;
  }

  async resolve(
    context: DocumentResolutionContext,
  ): Promise<Record<string, unknown>> {
    const { dosyaId, templateKey, headerData } = context;
    const queryExecutor = context.queryExecutor || DocumentEngine.queryExecutor;

    const mapping = DefaultDocumentResolver.mappingProvider
      ? DefaultDocumentResolver.mappingProvider(templateKey)
      : getTemplateMapping(templateKey);

    const resolver = new TemplateResolver(queryExecutor);
    let baseData: Record<string, unknown> = {};

    try {
      baseData = await resolver.resolve(mapping, dosyaId || 0, templateKey);
    } catch (e) {
      console.warn(
        `[DefaultDocumentResolver] mapping resolver error for "${templateKey}":`,
        e,
      );
    }

    const effectiveTarih = (baseData.dosyaTarihi as string) ||
      (baseData.tarih as string) ||
      headerData.dosyaTarihi ||
      new Date().toISOString().split("T")[0];
    const effectiveKonu = (baseData.konu as string) ||
      (baseData.isinAciklamasi as string) ||
      (baseData.isinAdi as string) ||
      headerData.konu ||
      (baseData.dosyaKonusu as string) ||
      "";

    const isPersonelName = (val: unknown): boolean =>
      typeof val === "string" && val.trim().length > 0 &&
      !/^\d+$/.test(val.trim());

    let hazirlayanAdi = isPersonelName(baseData.hazirlayanPersonelAdi)
      ? String(baseData.hazirlayanPersonelAdi)
      : isPersonelName(headerData.hazirlayanPersonelAdi)
      ? String(headerData.hazirlayanPersonelAdi)
      : "";
    let hazirlayanUnvan = (baseData.hazirlayanPersonelUnvan as string) ||
      headerData.hazirlayanPersonelUnvan || "";
    let hazirlayanTel = (baseData.hazirlayanTelefon as string) ||
      headerData.hazirlayanTelefon || "";
    let hazirlayanMail = (baseData.hazirlayanEposta as string) ||
      headerData.hazirlayanEposta || "";

    let talepEdenAdi = isPersonelName(baseData.talepEdenPersonelAdi)
      ? String(baseData.talepEdenPersonelAdi)
      : isPersonelName(headerData.talepEdenPersonelAdi)
      ? String(headerData.talepEdenPersonelAdi)
      : "";
    let talepEdenUnvan = (baseData.talepEdenPersonelUnvan as string) ||
      headerData.talepEdenPersonelUnvan || "";
    let talepEdenTel = (baseData.talepEdenTelefon as string) ||
      headerData.talepEdenTelefon || "";
    let talepEdenMail = (baseData.talepEdenEposta as string) ||
      headerData.talepEdenEposta || "";

    let onaylayanAdi = isPersonelName(baseData.onaylayanPersonelAdi)
      ? String(baseData.onaylayanPersonelAdi)
      : isPersonelName(headerData.harcamaYetkilisiAdi)
      ? String(headerData.harcamaYetkilisiAdi)
      : "";
    let onaylayanUnvan = (baseData.onaylayanPersonelUnvan as string) ||
      headerData.harcamaYetkilisiUnvan ||
      "Harcama Yetkilisi";

    if (!hazirlayanAdi || !onaylayanAdi || !talepEdenAdi) {
      try {
        const dRows = await queryExecutor(
          "SELECT hazirlayan_personel_id, sunan_personel_id, talep_eden_personel_id, onay_personel_id FROM DATA_TeminDosyasi WHERE id = ?",
          [dosyaId],
        );
        const dRow = dRows && dRows[0] ? dRows[0] : null;
        const pIds = [
          dRow?.hazirlayan_personel_id || dRow?.sunan_personel_id,
          dRow?.talep_eden_personel_id,
          dRow?.onay_personel_id,
        ].filter(Boolean);

        if (pIds.length > 0) {
          const placeholders = pIds.map(() => "?").join(", ");
          const pRows = await queryExecutor(
            `SELECT id, ad_soyad, unvan, telefon, eposta FROM TANIM_Personel WHERE id IN (${placeholders})`,
            pIds,
          );
          const pMap = new Map<number, any>();
          pRows.forEach((p: any) => pMap.set(Number(p.id), p));

          const hazId = dRow?.hazirlayan_personel_id || dRow?.sunan_personel_id;
          if (hazId && pMap.has(Number(hazId)) && !hazirlayanAdi) {
            const p = pMap.get(Number(hazId));
            hazirlayanAdi = p.ad_soyad || "";
            hazirlayanUnvan = p.unvan || "";
            hazirlayanTel = p.telefon || "";
            hazirlayanMail = p.eposta || "";
          }
          const talId = dRow?.talep_eden_personel_id;
          if (talId && pMap.has(Number(talId)) && !talepEdenAdi) {
            const p = pMap.get(Number(talId));
            talepEdenAdi = p.ad_soyad || "";
            talepEdenUnvan = p.unvan || "";
            talepEdenTel = p.telefon || "";
            talepEdenMail = p.eposta || "";
          }
          const onayId = dRow?.onay_personel_id;
          if (onayId && pMap.has(Number(onayId)) && !onaylayanAdi) {
            const p = pMap.get(Number(onayId));
            onaylayanAdi = p.ad_soyad || "";
            onaylayanUnvan = p.unvan || "";
          }
        }

        // Genel Personel Fallback
        if (!hazirlayanAdi) {
          const fbRows = await queryExecutor(
            "SELECT ad_soyad, unvan, telefon, eposta FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY ad_soyad ASC LIMIT 1",
            [],
          );
          if (fbRows && fbRows[0]) {
            hazirlayanAdi = fbRows[0].ad_soyad || "";
            hazirlayanUnvan = fbRows[0].unvan || "";
            hazirlayanTel = fbRows[0].telefon || "";
            hazirlayanMail = fbRows[0].eposta || "";
          }
        }
      } catch {
        // Fallback error safely ignored
      }
    }

    if (!talepEdenAdi) {
      talepEdenAdi = hazirlayanAdi;
      talepEdenUnvan = hazirlayanUnvan;
      talepEdenTel = hazirlayanTel;
      talepEdenMail = hazirlayanMail;
    }

    const items = (baseData.ihtiyacKalemleri as any[]) ||
      (baseData.kalemler as any[]) ||
      (baseData.items as any[]) ||
      [];

    return {
      ...baseData,
      dosyaId: dosyaId || 0,
      dosyaNo: (baseData.dosyaNo as string) ||
        (baseData.teminNo as string) ||
        headerData.dosyaNo ||
        "",
      dosyaKonusu: effectiveKonu,
      konu: effectiveKonu,
      dosyaTarihi: effectiveTarih,
      tarih: effectiveTarih,
      antetSatirlari: headerData.antetSatirlari,
      kurumUst: headerData.kurumUst,
      kurumAdi: headerData.kurumAdi,
      mudurluk: headerData.mudurluk,
      ihtiyacYeri: (baseData.ihtiyacYeri as string) || headerData.mudurluk ||
        "",
      solLogo: headerData.solLogo,
      sagLogo: headerData.sagLogo,
      evrakSayisi: headerData.evrakSayisi || (baseData.evrakSayisi as string) ||
        "",
      sunulacakMakamAdi: baseData.sunulacakMakamAdi ||
        headerData.sunulacakMakam ||
        (headerData.harcamaYetkilisiUnvan
          ? `${headerData.harcamaYetkilisiUnvan.toUpperCase()}`
          : "HARCAMA YETKİLİSİ MAKAMINA"),
      hazirlayanPersonelAdi: hazirlayanAdi,
      hazirlayanPersonelUnvan: hazirlayanUnvan,
      hazirlayanTelefon: hazirlayanTel,
      hazirlayanEposta: hazirlayanMail,
      talepEdenPersonelAdi: talepEdenAdi,
      talepEdenPersonelUnvan: talepEdenUnvan,
      talepEdenTelefon: talepEdenTel,
      talepEdenEposta: talepEdenMail,
      onaylayanPersonelAdi: onaylayanAdi,
      onaylayanPersonelUnvan: onaylayanUnvan,
      onayTarihi: (baseData.onayTarihi as string) || effectiveTarih,
      onayaSunulanTarih: (baseData.onayaSunulanTarih as string) ||
        effectiveTarih,
      maddeNo: (baseData.maddeNo as string) ||
        (baseData.ihaleSekli as string) || "22/d",
      aciklama: (baseData.aciklama as string) ||
        (baseData.isinAciklamasi as string) ||
        effectiveKonu,
      isinAciklamasi: (baseData.isinAciklamasi as string) ||
        (baseData.aciklama as string) ||
        effectiveKonu,
      ihtiyacKalemleri: items,
      kalemler: items,
      items: items,
    };
  }
}
