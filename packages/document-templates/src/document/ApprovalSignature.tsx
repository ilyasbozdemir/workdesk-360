import React from "react";
import type { CommonDocumentFields } from "@worksuite-360/document-engine";
import { EditableField, FIELD_SOURCE_INFO } from "./EditableField";
import { useTemplateEdit } from "./TemplateEditContext";
import { cleanPersonelName, toIsoDate, toTrDate } from "../utils/textHelpers";

export { cleanPersonelName, toIsoDate, toTrDate };

export interface MergedPersonelItem {
  id: string | number;
  ad_soyad: string;
  unvan: string;
  label: string;
  rol?: string;
}

/**
 * Firmalardaki birleştirme/normalizasyon mantığı ile aynı şekilde:
 * Global personel listesi, aktif dosyadaki komisyon üyeleri, rota adımları ve
 * mevcut belgede tanımlı personel alanlarını tek bir tekrarsız havuzda birleştirir.
 */
export function buildMergedPersonelList(
  rawPersonelList?: any[],
  data?: Record<string, any>,
  currentAdSoyad?: string | null,
  currentUnvan?: string | null,
): MergedPersonelItem[] {
  const baseList =
    (rawPersonelList && rawPersonelList.length > 0
      ? rawPersonelList
      : data?.personelListesi &&
          Array.isArray(data.personelListesi) &&
          data.personelListesi.length > 0
      ? data.personelListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activePersonelListesi
      : []) || [];

  const combinedRaw: any[] = [...baseList];

  if (data) {
    if (Array.isArray(data.komisyonUyeleri)) combinedRaw.push(...data.komisyonUyeleri);
    if (Array.isArray(data.muayeneKomisyonu)) combinedRaw.push(...data.muayeneKomisyonu);
    if (Array.isArray(data.fiyatArastirmaGorevlileri)) {
      combinedRaw.push(...data.fiyatArastirmaGorevlileri);
    }
    if (Array.isArray(data.rota)) combinedRaw.push(...data.rota);
    if (Array.isArray(data.koordinasyon)) combinedRaw.push(...data.koordinasyon);

    const docPersonelFields = [
      { a: data.hazirlayanPersonelAdi, u: data.hazirlayanPersonelUnvan, r: "Hazırlayan" },
      { a: data.onaylayanPersonelAdi, u: data.onaylayanPersonelUnvan, r: "Harcama Yetkilisi" },
      {
        a: data.gerceklestirmeGorevlisiAdi,
        u: data.gerceklestirmeGorevlisiUnvani,
        r: "Gerçekleştirme Görevlisi",
      },
      { a: data.kontrolPersonelAdi, u: data.kontrolPersonelUnvan, r: "Kontrol Görevlisi" },
    ];
    for (const dp of docPersonelFields) {
      if (dp.a && String(dp.a).trim() !== "") {
        combinedRaw.push({ ad_soyad: dp.a, unvan: dp.u || "", rol: dp.r });
      }
    }
  }

  const seenMap = new Map<string, MergedPersonelItem>();

  for (const item of combinedRaw) {
    if (!item) continue;
    const rawObj = item.personel || item;
    const rawName =
      rawObj.ad_soyad ||
      rawObj.adSoyad ||
      rawObj.a ||
      rawObj.name ||
      rawObj.tam_ad ||
      "";
    const cleanName = cleanPersonelName(rawName);
    if (!cleanName) continue;

    const key = cleanName.toLowerCase();
    const unvan = String(
      rawObj.unvan ||
        rawObj.u ||
        rawObj.gorevi ||
        rawObj.rol ||
        item.gorevi ||
        item.rol ||
        "",
    ).trim();
    const id = rawObj.id ?? item.id ?? `personel_${cleanName}`;
    const label = unvan ? `${cleanName} (${unvan})` : cleanName;

    const existing = seenMap.get(key);
    if (!existing) {
      seenMap.set(key, {
        id,
        ad_soyad: cleanName,
        unvan,
        label,
        rol: item.rol || item.t,
      });
    } else {
      if (!existing.unvan && unvan) {
        existing.unvan = unvan;
        existing.label = `${existing.ad_soyad} (${unvan})`;
      }
      if (
        String(existing.id).startsWith("personel_") &&
        !String(id).startsWith("personel_")
      ) {
        existing.id = id;
      }
    }
  }

  const personelList = Array.from(seenMap.values());

  const cleanCurrent = cleanPersonelName(currentAdSoyad);
  if (
    cleanCurrent &&
    !personelList.some(
      (p) => p.ad_soyad.toLowerCase() === cleanCurrent.toLowerCase(),
    )
  ) {
    const u = String(currentUnvan || "").trim();
    personelList.unshift({
      id: `custom_${cleanCurrent}`,
      ad_soyad: cleanCurrent,
      unvan: u,
      label: u ? `${cleanCurrent} (${u})` : cleanCurrent,
    });
  }

  return personelList.filter(
    (p) => p && p.ad_soyad && p.ad_soyad.trim() !== "",
  );
}

export interface DateEditableFieldProps {
  name: string;
  value?: string;
  placeholder?: string;
  defaultDate?: string;
}

export function DateEditableField({
  name,
  value,
  placeholder = "GG.AA.YYYY",
  defaultDate,
}: DateEditableFieldProps) {
  const { isEditing, onFieldChange } = useTemplateEdit();
  const rawVal = value || defaultDate;
  const displayVal = rawVal ? toTrDate(rawVal) : toTrDate(new Date());
  const isoVal = toIsoDate(displayVal);

  if (!isEditing || !onFieldChange) {
    return <span>{displayVal}</span>;
  }

  const tooltipText = FIELD_SOURCE_INFO[name] ||
    "ℹ️ Tarih seçmek veya değiştirmek için takvime tıklayın.";

  return (
    <input
      type="date"
      value={isoVal}
      onChange={(e) => {
        const val = e.target.value;
        if (val) {
          onFieldChange(name, toTrDate(val));
        }
      }}
      style={{
        fontSize: "inherit",
        fontFamily: "inherit",
        fontWeight: "inherit",
        color: "inherit",
        padding: "0 2px",
        borderRadius: "0",
        border: "none",
        borderBottom: "1px dashed #94a3b8",
        backgroundColor: "transparent",
        cursor: "pointer",
        display: "inline-block",
        outline: "none",
        verticalAlign: "baseline",
      }}
      title={tooltipText}
    />
  );
}

export interface PersonelInlineSelectProps {
  nameField: string;
  unvanField?: string;
  value?: string | null;
  placeholder?: string;
  onlyAdSoyad?: boolean;
}

export const PersonelInlineSelect: React.FC<PersonelInlineSelectProps> = ({
  nameField,
  unvanField,
  value,
  placeholder = "Personel Seçiniz...",
}) => {
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const cleanVal = cleanPersonelName(value);
  const personelList = buildMergedPersonelList(
    personelListesi,
    data,
    cleanVal,
    unvanField && data ? data[unvanField] : undefined,
  );
  const matched = personelList.find(
    (p: any) =>
      p.ad_soyad &&
      cleanPersonelName(p.ad_soyad).toLowerCase() === cleanVal.toLowerCase(),
  );
  const selectedValue = matched ? String(matched.id || matched.ad_soyad) : "";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <EditableField
        name={nameField}
        value={cleanVal}
        placeholder={placeholder}
      />
      {isEditing && personelList.length > 0 && (
        <select
          value={selectedValue}
          onChange={(e) => {
            const val = e.target.value;
            const p = personelList.find(
              (item: any) => String(item.id || item.ad_soyad) === val,
            );
            if (p && onFieldChange) {
              const cleanName = cleanPersonelName(p.ad_soyad);
              onFieldChange(nameField, cleanName);
              if (unvanField) {
                onFieldChange(unvanField, p.unvan || "");
              }
            } else if (onFieldChange && val === "") {
              onFieldChange(nameField, "");
              if (unvanField) {
                onFieldChange(unvanField, "");
              }
            }
          }}
          style={{
            fontSize: "7.5pt",
            padding: "1px 4px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#f8fafc",
            maxWidth: "140px",
            cursor: "pointer",
          }}
          title="Kayıtlı personellerden seç"
        >
          <option value="">👤 Seç...</option>
          {personelList.map((p: any, idx: number) => (
            <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
              {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
            </option>
          ))}
        </select>
      )}
    </span>
  );
};

export interface BirimInlineSelectProps {
  nameField?: string;
  value?: string | null;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const BirimInlineSelect: React.FC<BirimInlineSelectProps> = ({
  nameField = "muhatapBirim",
  value,
  placeholder = "Muhatap Birim Seçiniz / Yazınız...",
  style,
}) => {
  const { isEditing, onFieldChange, birimListesi } = useTemplateEdit();
  const birimList = birimListesi || [];
  const cleanVal = typeof value === "string" ? value.trim() : "";
  const matched = birimList.find(
    (b: any) =>
      (b.sunum_makami &&
        String(b.sunum_makami).trim().toLowerCase() ===
          cleanVal.toLowerCase()) ||
      (b.birim_adi &&
        String(b.birim_adi).trim().toLowerCase() === cleanVal.toLowerCase()) ||
      (b.ad && String(b.ad).trim().toLowerCase() === cleanVal.toLowerCase()),
  );
  const selectedValue = matched ? String(matched.id) : "";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: "100%",
      }}
    >
      <EditableField
        name={nameField}
        value={cleanVal}
        placeholder={placeholder}
        style={style}
      />
      {isEditing && birimList.length > 0 && (
        <select
          value={selectedValue}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            const b = birimList.find((item: any) => item.id === selectedId);
            if (b && onFieldChange) {
              const sunum = (b.sunum_makami || b.birim_adi || b.ad || "").trim()
                .toUpperCase();
              onFieldChange(nameField, sunum);
            }
          }}
          style={{
            fontSize: "7.5pt",
            padding: "2px 4px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#f8fafc",
            maxWidth: "160px",
            cursor: "pointer",
            fontWeight: "normal",
            textTransform: "none",
          }}
          title="Tanımlı birimlerin muhatap/sunum makamından seç"
        >
          <option value="">🏢 Birim Seç...</option>
          {birimList.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.sunum_makami || b.birim_adi || b.ad}
            </option>
          ))}
        </select>
      )}
    </span>
  );
};

export const EditableOlurPlaceholder: React.FC = () => {
  const { isEditing, onFieldChange } = useTemplateEdit();
  if (!isEditing || !onFieldChange) return null;

  return (
    <div
      onClick={() => onFieldChange("olurYazisi", true)}
      style={{
        marginTop: "30px",
        padding: "8px 16px",
        border: "1.5px dashed #94a3b8",
        borderRadius: "8px",
        textAlign: "center",
        color: "#475569",
        fontSize: "10pt",
        fontWeight: "bold",
        cursor: "pointer",
        backgroundColor: "#f8fafc",
        userSelect: "none",
      }}
      title="OLUR bloğunu belgeye eklemek için tıklayın"
    >
      <span style={{ marginRight: "6px" }}>☑</span>
      OLUR Bloğu Gizli (Göster ve Düzenle)
    </div>
  );
};

interface PersonelCardProps {
  adSoyad?: string | null;
  unvan?: string | null;
  telefon?: string | null;
  eposta?: string | null;
  align?: "left" | "center" | "right";
  marginTop?: number;
  marginBottom?: number;
  showContactInfo?: boolean;
  nameField?: string;
  unvanField?: string;
  placeholderName?: string;
  placeholderUnvan?: string;
  isFirmaSelect?: boolean;
  role?: string;
}

export const PersonelCard: React.FC<PersonelCardProps> = ({
  adSoyad,
  unvan,
  telefon,
  eposta,
  align = "center",
  marginTop = 20,
  marginBottom = 20,
  showContactInfo = false,
  nameField = "hazirlayanPersonelAdi",
  unvanField = "hazirlayanPersonelUnvan",
  placeholderName,
  placeholderUnvan,
  isFirmaSelect = false,
  role = "Hazırlayan",
}) => {
  const { isEditing, onFieldChange, personelListesi, firmaListesi, data } =
    useTemplateEdit();
  const personelList = buildMergedPersonelList(
    personelListesi,
    data,
    isFirmaSelect ? null : adSoyad,
    isFirmaSelect ? null : unvan,
  );
  const rawFirmaList =
    (firmaListesi && firmaListesi.length > 0
      ? firmaListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activeFirmaListesi
      : []) || [];

  const normalizedFirmaList = rawFirmaList.map((item: any) => {
    if (item && item.firm) {
      const u = item.firm.unvan || item.firm.firma_adi || item.unvan ||
        "İstekli Firma";
      return {
        ...item.firm,
        id: item.firm.id || item.id,
        unvan: u,
        total: item.total,
        isWinner: item.isWinner,
        label: item.label || item.firm.label ||
          (item.total > 0 ? `${u} (${item.total} TL)` : u),
      };
    }
    const u = item?.unvan || item?.firma_adi || item?.name || "";
    return {
      ...item,
      unvan: u,
      label: item?.label || u,
    };
  });

  const firmaList = [...normalizedFirmaList];
  if (
    adSoyad &&
    isFirmaSelect &&
    !firmaList.some(
      (f: any) =>
        (f.unvan || f.label) &&
        String(f.unvan || f.label).trim().toLowerCase() ===
          String(adSoyad).trim().toLowerCase(),
    )
  ) {
    firmaList.unshift({
      id: `custom_${adSoyad}`,
      unvan: adSoyad,
      label: adSoyad,
    });
  }

  const validFirmaList = firmaList.filter(
    (f: any) =>
      f && (f.unvan || f.label) && String(f.unvan || f.label).trim() !== "",
  );

  const matched = isFirmaSelect
    ? validFirmaList.find(
      (f: any) =>
        f.unvan &&
        String(f.unvan).trim().toLowerCase() ===
          cleanPersonelName(adSoyad).toLowerCase(),
    )
    : personelList.find(
      (p: any) =>
        p.ad_soyad &&
        cleanPersonelName(p.ad_soyad).toLowerCase() ===
          cleanPersonelName(adSoyad).toLowerCase(),
    );

  const selectedValue = matched
    ? String(matched.id || (matched as any).unvan || (matched as any).ad_soyad)
    : "";

  const namePlaceholder = placeholderName ||
    (isFirmaSelect
      ? "Firma Adı / Kaşe"
      : (isEditing && personelList.length > 0
        ? "Adı Soyadı"
        : "Adı Soyadı / Kaşe"));
  const unvanPlaceholder = placeholderUnvan || "Unvanı";

  // Belge içi otomatik rota adımları (Hazırlayan / Paraf / Koordinasyon / Kontrol)
  const isPrimaryHazirlayanCard =
    !isFirmaSelect && nameField === "hazirlayanPersonelAdi";
  const allRotaSteps: RotaItem[] = Array.isArray(data?.rota) ? data.rota : [];
  // Olur / İmza dışındaki ara/hazırlayan adımlar doğrudan PersonelCard alanında yan yana gösterilebilir
  const inlineRotaIndices = isPrimaryHazirlayanCard
    ? allRotaSteps
        .map((step, idx) => ({ step, idx }))
        .filter(
          ({ step }) =>
            step.t !== "Olur" &&
            step.t !== "İmza" &&
            (step as any).rol !== "Olur" &&
            (step as any).rol !== "İmza",
        )
    : [];
  const hasMultipleInlineRota =
    isPrimaryHazirlayanCard &&
    data?.belgeModu === "koordinasyonlu" &&
    inlineRotaIndices.length > 1;

  // Eğer rota içinden Hazırlayan adımı gelmişse ve prop boşsa otomatik doldur
  const hazirlayanRotaStep = isPrimaryHazirlayanCard
    ? allRotaSteps.find((s) => s.t === "Hazırlayan" || (s as any).rol === "Hazırlayan")
    : undefined;
  const effectiveAdSoyad =
    adSoyad ||
    (data && nameField ? data[nameField] : "") ||
    hazirlayanRotaStep?.a ||
    "";
  const effectiveUnvan =
    unvan ||
    (data && unvanField ? data[unvanField] : "") ||
    hazirlayanRotaStep?.u ||
    "";

  const handleAddInlineRotaStep = () => {
    if (!onFieldChange) return;
    const today = toTrDate(new Date());
    const currentRota: RotaItem[] = Array.isArray(data?.rota)
      ? [...data.rota]
      : [];
    if (currentRota.length === 0) {
      const curHazirlayan =
        effectiveAdSoyad ||
        (personelList[0]?.ad_soyad
          ? cleanPersonelName(personelList[0].ad_soyad)
          : "");
      const curUnvan =
        effectiveUnvan || personelList[0]?.unvan || "Görevli Personel";
      currentRota.push({
        t: "Hazırlayan",
        a: curHazirlayan,
        u: curUnvan,
        tarih: today,
      });
    }
    const nextPerson =
      personelList.find(
        (p) =>
          !currentRota.some(
            (r) =>
              cleanPersonelName(r.a).toLowerCase() ===
              cleanPersonelName(p.ad_soyad).toLowerCase(),
          ),
      ) || personelList[1];
    currentRota.push({
      t: "Paraf",
      a: nextPerson ? cleanPersonelName(nextPerson.ad_soyad) : "",
      u: nextPerson?.unvan || "Birim Yetkilisi",
      tarih: today,
    });
    onFieldChange("belgeModu", "koordinasyonlu");
    onFieldChange("rota", currentRota);
  };

  if (hasMultipleInlineRota) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          pageBreakInside: "avoid",
          breakInside: "avoid",
          marginTop: `${marginTop}px`,
          marginBottom: `${marginBottom}px`,
          gap: "8px",
        }}
      >
        {isEditing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "6.5pt",
                color: "#7c3aed",
                backgroundColor: "#f5f3ff",
                border: "1px solid #ddd6fe",
                padding: "1px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              🔀 Rota Aktif ({allRotaSteps.length} Adım)
            </span>
            <button
              type="button"
              onClick={handleAddInlineRotaStep}
              style={{
                fontSize: "7pt",
                padding: "1px 6px",
                borderRadius: "4px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              + Rol / Paraf Ekle
            </button>
            <button
              type="button"
              onClick={() => onFieldChange && onFieldChange("belgeModu", "standart")}
              style={{
                fontSize: "7pt",
                padding: "1px 6px",
                borderRadius: "4px",
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
              }}
              title="Tekli standart imzaya dön"
            >
              Tekli Görünüm
            </button>
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "100%",
            justifyContent:
              inlineRotaIndices.length === 1 ? "flex-end" : "space-around",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          {inlineRotaIndices.map(({ step, idx: stepIndex }) => {
            const stepCleanName = cleanPersonelName(step.a);
            const stepMatched = personelList.find(
              (p: any) =>
                p.ad_soyad &&
                cleanPersonelName(p.ad_soyad).toLowerCase() ===
                  stepCleanName.toLowerCase(),
            );
            const stepSelectedVal = stepMatched
              ? String(stepMatched.id || stepMatched.ad_soyad)
              : "";

            return (
              <div
                key={stepIndex}
                style={{
                  textAlign: "center",
                  minWidth: "160px",
                  maxWidth: "220px",
                  lineHeight: 1.4,
                  padding: isEditing ? "6px 8px" : "2px 4px",
                  border: isEditing ? "1px dashed #cbd5e1" : "none",
                  borderRadius: "6px",
                  backgroundColor: isEditing ? "#f8fafc" : "transparent",
                }}
              >
                {isEditing ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "4px",
                      }}
                    >
                      <select
                        value={step.t || "Paraf"}
                        onChange={(e) => {
                          if (!onFieldChange) return;
                          const nextRota = [...allRotaSteps];
                          nextRota[stepIndex] = {
                            ...nextRota[stepIndex],
                            t: e.target.value,
                          };
                          onFieldChange("rota", nextRota);
                        }}
                        style={{
                          fontSize: "7pt",
                          fontWeight: 700,
                          color: "#4338ca",
                          backgroundColor: "#eef2ff",
                          border: "1px solid #c7d2fe",
                          borderRadius: "4px",
                          padding: "1px 4px",
                          cursor: "pointer",
                          flex: 1,
                        }}
                      >
                        <option value="Hazırlayan">Hazırlayan</option>
                        <option value="Paraf">Paraf</option>
                        <option value="Koordinasyon">Koordinasyon</option>
                        <option value="Kontrol">Kontrol</option>
                        <option value="Gerçekleştirme Görevlisi">
                          Gerçekleştirme Görevlisi
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!onFieldChange) return;
                          const nextRota = allRotaSteps.filter(
                            (_, i) => i !== stepIndex,
                          );
                          onFieldChange("rota", nextRota);
                        }}
                        style={{
                          fontSize: "6.5pt",
                          padding: "1px 4px",
                          borderRadius: "3px",
                          border: "1px solid #fca5a5",
                          backgroundColor: "#fef2f2",
                          color: "#b91c1c",
                          cursor: "pointer",
                        }}
                        title="Bu rolü kaldır"
                      >
                        ✕
                      </button>
                    </div>

                    <select
                      value={stepSelectedVal}
                      onChange={(e) => {
                        if (!onFieldChange) return;
                        const val = e.target.value;
                        const p = personelList.find(
                          (item: any) =>
                            String(item.id || item.ad_soyad) === val,
                        );
                        const nextRota = [...allRotaSteps];
                        if (p) {
                          const cName = cleanPersonelName(p.ad_soyad);
                          nextRota[stepIndex] = {
                            ...nextRota[stepIndex],
                            a: cName,
                            u: p.unvan || nextRota[stepIndex]?.u || "",
                          };
                          if (step.t === "Hazırlayan") {
                            onFieldChange("hazirlayanPersonelAdi", cName);
                            onFieldChange(
                              "hazirlayanPersonelUnvan",
                              p.unvan || "",
                            );
                          }
                        } else if (val === "") {
                          nextRota[stepIndex] = {
                            ...nextRota[stepIndex],
                            a: "",
                            u: "",
                          };
                        }
                        onFieldChange("rota", nextRota);
                      }}
                      style={{
                        fontSize: "7pt",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">👤 Personel Seç...</option>
                      {personelList.map((p: any, pIdx: number) => (
                        <option
                          key={p.id || pIdx}
                          value={String(p.id || p.ad_soyad)}
                        >
                          {p.label ||
                            `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  step.t &&
                  step.t !== "Hazırlayan" && (
                    <div
                      style={{
                        fontSize: "9pt",
                        fontWeight: "bold",
                        color: "#334155",
                        marginBottom: "2px",
                      }}
                    >
                      {step.t}
                    </div>
                  )
                )}

                <div style={{ fontWeight: "bold", fontSize: "11pt" }}>
                  {stepCleanName || (isEditing ? "Adı Soyadı" : "")}
                </div>
                <div style={{ fontSize: "10.5pt" }}>
                  {step.u || (isEditing ? "Unvanı" : "")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        justifyContent: align === "center"
          ? "center"
          : align === "right"
          ? "flex-end"
          : "flex-start",
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
      }}
    >
      <div
        style={{
          textAlign: "center",
          minWidth: "180px",
          maxWidth: "100%",
          lineHeight: 1.45,
        }}
      >
        {isEditing && (
          <div style={{ marginBottom: "3px" }}>
            <select
              value={selectedValue}
              onChange={(e) => {
                const val = e.target.value;
                if (isFirmaSelect) {
                  const f = validFirmaList.find((item: any) =>
                    String(item.id || item.unvan) === val
                  );
                  if (f && onFieldChange) {
                    onFieldChange(nameField, f.unvan);
                    onFieldChange(
                      unvanField,
                      f.yetkili_ad_soyad
                        ? `Yetkili: ${f.yetkili_ad_soyad}`
                        : "Yüklenici Firma / Yetkilisi",
                    );
                  } else if (onFieldChange && val === "") {
                    onFieldChange(nameField, "");
                    onFieldChange(unvanField, "");
                  }
                } else {
                  const p = personelList.find(
                    (item: any) => String(item.id || item.ad_soyad) === val,
                  );
                  if (p && onFieldChange) {
                    const cleanName = cleanPersonelName(p.ad_soyad);
                    onFieldChange(nameField, cleanName);
                    onFieldChange(unvanField, p.unvan || "");
                    // Otomatik rota senkronizasyonu
                    if (data && Array.isArray(data.rota) && data.rota.length > 0) {
                      const updatedRota = data.rota.map((r: any) => {
                        if (r.t === (role || "Hazırlayan") || (nameField === "hazirlayanPersonelAdi" && r.t === "Hazırlayan")) {
                          return { ...r, a: cleanName, u: p.unvan || r.u };
                        }
                        return r;
                      });
                      onFieldChange("rota", updatedRota);
                    }
                  } else if (onFieldChange && val === "") {
                    onFieldChange(nameField, "");
                    onFieldChange(unvanField, "");
                  }
                }
              }}
              style={{
                fontSize: "7.5pt",
                padding: "2px 4px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                maxWidth: "180px",
                cursor: "pointer",
                margin: "0 auto",
              }}
              title={isFirmaSelect
                ? "Kayıtlı/İstekli firmalardan seçim yapın"
                : "Kayıtlı personellerden seçim yapın"}
            >
              <option value="">
                {isFirmaSelect
                  ? "🏢 Firma Seç... (Seçim Yok / Null)"
                  : "👤 Personel Seç..."}
              </option>
              {isFirmaSelect
                ? validFirmaList.map((f: any, idx: number) => (
                  <option key={f.id || idx} value={String(f.id || f.unvan)}>
                    {f.label || f.unvan}
                  </option>
                ))
                : personelList.map((p: any, idx: number) => (
                  <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
                    {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
                  </option>
                ))}
            </select>

            {!isFirmaSelect && (
              <div style={{ marginTop: "3px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                {data?.belgeModu !== "koordinasyonlu" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onFieldChange) {
                        onFieldChange("belgeModu", "koordinasyonlu");
                        const today = toTrDate(new Date());
                        const initialRota: any[] = [];
                        const curHazirlayan = adSoyad || (personelList[0]?.ad_soyad ? cleanPersonelName(personelList[0].ad_soyad) : "");
                        const curUnvan = unvan || personelList[0]?.unvan || "Görevli Personel";
                        initialRota.push({ t: "Hazırlayan", a: curHazirlayan, u: curUnvan, tarih: today });
                        if (personelList.length > 1) {
                          initialRota.push({ t: "Paraf", a: cleanPersonelName(personelList[1].ad_soyad), u: personelList[1].unvan || "Birim Yetkilisi", tarih: today });
                        } else {
                          initialRota.push({ t: "Paraf", a: "", u: "Birim Yetkilisi", tarih: today });
                        }
                        if (data?.onaylayanPersonelAdi) {
                          initialRota.push({ t: "İmza", a: data.onaylayanPersonelAdi, u: data.onaylayanPersonelUnvan || "Harcama Yetkilisi", tarih: today });
                        }
                        onFieldChange("rota", initialRota);
                      }
                    }}
                    style={{
                      fontSize: "7pt",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      fontWeight: 600,
                    }}
                    title="Belgeye paraf ve koordinasyon akışı ekle"
                  >
                    ⚡ + Paraf / Rota Ekle
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: "6.5pt",
                      color: "#7c3aed",
                      backgroundColor: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      fontWeight: 600,
                    }}
                  >
                    🔀 Rota Aktif ({Array.isArray(data?.rota) ? data.rota.length : 0} Adım)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ fontWeight: "bold", fontSize: "11pt" }}>
          <EditableField
            name={nameField}
            value={cleanPersonelName(effectiveAdSoyad) || ""}
            placeholder={namePlaceholder}
          />
        </div>
        <div style={{ fontSize: "11pt" }}>
          <EditableField
            name={unvanField}
            value={effectiveUnvan || ""}
            placeholder={unvanPlaceholder}
          />
        </div>
        {showContactInfo && (
          <>
            {telefon && (
              <div style={{ fontSize: "10pt", color: "#666" }}>
                Tel: {telefon}
              </div>
            )}
            {eposta && (
              <div style={{ fontSize: "10pt", color: "#666" }}>
                E-posta: {eposta}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface ApprovalSignatureProps {
  title?: string;
  date?: string | null;
  adSoyad?: string | null;
  unvan?: string | null;
  showSpace?: boolean;
  marginTop?: number;
  align?: "left" | "center" | "right";
  nameField?: string;
  unvanField?: string;
  dateField?: string;
}

export const ApprovalSignature: React.FC<ApprovalSignatureProps> = ({
  title = "OLUR",
  date,
  adSoyad,
  unvan,
  showSpace = true,
  marginTop = 40,
  align = "center",
  nameField = "onaylayanPersonelAdi",
  unvanField = "onaylayanPersonelUnvan",
  dateField = "onayTarihi",
}) => {
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const personelList = buildMergedPersonelList(
    personelListesi,
    data,
    adSoyad,
    unvan,
  );
  const matched = personelList.find(
    (p: any) =>
      p.ad_soyad &&
      cleanPersonelName(p.ad_soyad).toLowerCase() ===
        cleanPersonelName(adSoyad).toLowerCase(),
  );
  const selectedValue = matched ? String(matched.id || matched.ad_soyad) : "";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        justifyContent: align === "center"
          ? "center"
          : align === "right"
          ? "flex-end"
          : "flex-start",
        marginTop: `${marginTop}px`,
      }}
    >
      <div
        style={{
          textAlign: "center",
          minWidth: "220px",
          lineHeight: 1.5,
          position: "relative",
        }}
      >
        <div
          style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "4px" }}
        >
          <EditableField name="olurBaslik" value={title} placeholder="OLUR" />
        </div>

        <div style={{ fontSize: "11pt", marginBottom: "8px" }}>
          <DateEditableField
            name={dateField}
            value={date || ""}
            placeholder="GG.AA.YYYY"
          />
        </div>

        {isEditing && personelList.length > 0 && (
          <div style={{ marginTop: "4px", marginBottom: "6px" }}>
            <select
              value={selectedValue}
              onChange={(e) => {
                const val = e.target.value;
                const p = personelList.find(
                  (item: any) => String(item.id || item.ad_soyad) === val,
                );
                if (p && onFieldChange) {
                  const cleanName = cleanPersonelName(p.ad_soyad);
                  onFieldChange(nameField, cleanName);
                  onFieldChange(unvanField, p.unvan || "");
                  // Otomatik rota senkronizasyonu
                  if (data && Array.isArray(data.rota) && data.rota.length > 0) {
                    const updatedRota = data.rota.map((r: any) => {
                      if (r.t === "İmza" || r.t === "Olur" || (r as any).rol === "İmza" || (r as any).rol === "Olur") {
                        return { ...r, a: cleanName, u: p.unvan || r.u };
                      }
                      return r;
                    });
                    onFieldChange("rota", updatedRota);
                  }
                } else if (onFieldChange && val === "") {
                  onFieldChange(nameField, "");
                  onFieldChange(unvanField, "");
                }
              }}
              style={{
                fontSize: "7.5pt",
                padding: "2px 4px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                maxWidth: "180px",
                cursor: "pointer",
                margin: "0 auto",
              }}
              title="Kayıtlı personellerden seçim yapın"
            >
              <option value="">👤 Personel Seç...</option>
              {personelList.map((p: any, idx: number) => (
                <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
                  {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {showSpace && (
          <div
            style={{ minHeight: "24px", marginBottom: "4px" }}
          />
        )}

        <div
          style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "4px" }}
        >
          <EditableField
            name={nameField}
            value={adSoyad || ""}
            placeholder={isEditing && personelList.length > 0
              ? "Adı Soyadı"
              : "Onaylayan Adı Soyadı"}
          />
        </div>

        <div style={{ fontSize: "11pt" }}>
          <EditableField
            name={unvanField}
            value={unvan || ""}
            placeholder="Unvanı"
          />
        </div>
      </div>
    </div>
  );
};

interface CommissionMember {
  adSoyad: string;
  unvan: string;
  gorevi?: string;
}

interface CommissionListProps {
  members: CommissionMember[];
  title?: string;
  marginTop?: number;
}

export const CommissionList: React.FC<CommissionListProps> = ({
  members,
  title = "Komisyon Üyeleri",
  marginTop = 30,
}) => {
  if (!members || members.length === 0) return null;

  return (
    <div
      style={{
        marginTop: `${marginTop}px`,
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <div
        style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "15px" }}
      >
        {title}
      </div>

      {members.map((member, idx) => (
        <div key={idx} style={{ marginBottom: "12px", lineHeight: 1.6 }}>
          <div style={{ fontSize: "11pt" }}>
            <strong>{cleanPersonelName(member.adSoyad)}</strong>
          </div>
          <div style={{ fontSize: "10pt" }}>{member.unvan}</div>
          {member.gorevi && (
            <div style={{ fontSize: "10pt", color: "#666" }}>
              ({member.gorevi})
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface MetadataBlockProps {
  evrakSayisi?: string;
  tarih?: string;
  onayaSunulanTarih?: string;
  dosyaKonusu?: string;
  showBorder?: boolean;
}

export const MetadataBlock: React.FC<MetadataBlockProps> = ({
  evrakSayisi,
  tarih,
  onayaSunulanTarih,
  dosyaKonusu,
  showBorder = false,
}) => {
  const displayTarih = toTrDate(tarih || onayaSunulanTarih);

  // Sanitize dosyaKonusu if it contains accidental JSON string keys or quotes
  let cleanKonu = dosyaKonusu;
  if (typeof cleanKonu === "string") {
    const jsonMatch = cleanKonu.match(/"?[a-zA-Z0-9_]+"?\s*:\s*"([^"]+)"/);
    if (jsonMatch) {
      cleanKonu = jsonMatch[1];
    }
    cleanKonu = cleanKonu.replace(/^["']|["',]+$/g, "").trim();
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px",
        paddingBottom: showBorder ? "8px" : 0,
        borderBottom: showBorder ? `1px solid #ccc` : "none",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <div style={{ maxWidth: "65%", flex: "1 1 auto" }}>
        <table
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            fontSize: "11pt",
            borderSpacing: 0,
            width: "100%",
          }}
        >
          <tbody>
            {evrakSayisi !== undefined && (
              <tr>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 0",
                    width: "45px",
                  }}
                >
                  <strong>Sayı</strong>
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 5px 1px 0",
                    width: "10px",
                  }}
                >
                  <strong>:</strong>
                </td>
                <td style={{ verticalAlign: "top", padding: "1px 0" }}>
                  <EditableField name="evrakSayisi" value={evrakSayisi} />
                </td>
              </tr>
            )}
            {dosyaKonusu !== undefined && (
              <tr>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 0",
                    width: "45px",
                  }}
                >
                  <strong>Konu</strong>
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 5px 1px 0",
                    width: "10px",
                  }}
                >
                  <strong>:</strong>
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 0",
                    textAlign: "justify",
                  }}
                >
                  <EditableField
                    name="dosyaKonusu"
                    value={cleanKonu}
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Boolean(displayTarih) && (
        <div
          style={{
            fontSize: "11pt",
            textAlign: "right",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingLeft: "16px",
            paddingTop: "1px",
          }}
        >
          <strong>Tarih:</strong>{" "}
          <DateEditableField name="onayaSunulanTarih" value={displayTarih} />
        </div>
      )}
    </div>
  );
};

export interface DocumentMetadataProps {
  data: Partial<CommonDocumentFields> & Record<string, any>;
  showBorder?: boolean;
}

/**
 * Merkezi Ortak Belge Üst Bilgi Bileşeni (DocumentMetadata)
 * MetadataBlock üzerine kurulu, CommonDocumentFields modelini doğrudan tüketen yardımcı bileşen.
 */
export const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  data,
  showBorder = false,
}) => {
  return (
    <MetadataBlock
      evrakSayisi={data?.evrakSayisi}
      tarih={data?.dosyaTarihi || data?.tarih}
      onayaSunulanTarih={data?.onayaSunulanTarih}
      dosyaKonusu={data?.dosyaKonusu || (data as any)?.konu}
      showBorder={showBorder}
    />
  );
};

export interface RotaItem {
  t?: string; // Tür: Hazırlayan, Paraf, Koordinasyon, İmza, Olur
  a?: string; // Ad Soyad
  u?: string; // Unvan
  sira?: number;
  tarih?: string;
}

export interface KoordinasyonItem {
  adSoyad?: string;
  unvan?: string;
  tarih?: string;
  rol?: string;
}

export interface RotaKoordinasyonBlockProps {
  rota?: RotaItem[];
  koordinasyon?: KoordinasyonItem[];
  belgeModu?: "standart" | "koordinasyonlu" | "hizli_onay";
  marginTop?: number;
}

export const RotaKoordinasyonBlock: React.FC<RotaKoordinasyonBlockProps> = ({
  rota,
  koordinasyon,
  belgeModu,
  marginTop = 24,
}) => {
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const personelList = buildMergedPersonelList(personelListesi, data);

  const effectiveMode = data?.belgeModu || belgeModu || "standart";

  // Birleştirilmiş rota / koordinasyon listesi
  const activeRota: RotaItem[] = (
    data?.rota && Array.isArray(data.rota)
      ? data.rota
      : Array.isArray(rota)
      ? rota
      : Array.isArray(koordinasyon)
      ? koordinasyon.map((k) => ({
        t: k.rol || "Koordinasyon",
        a: k.adSoyad || "",
        u: k.unvan || "",
        tarih: k.tarih || toTrDate(new Date()),
      }))
      : []
  );

  const items: Array<{
    tur: string;
    adSoyad: string;
    unvan: string;
    tarih: string;
  }> = activeRota.map((r) => ({
    tur: r.t || "Paraf",
    adSoyad: cleanPersonelName(r.a) || "",
    unvan: r.u || "",
    tarih: r.tarih || toTrDate(new Date()),
  }));

  const handleUpdateStep = (idx: number, field: keyof RotaItem, val: string) => {
    if (!onFieldChange) return;
    const updated = [...activeRota];
    updated[idx] = { ...updated[idx], [field]: val };
    onFieldChange("rota", updated);
  };

  const handleSelectPersonel = (idx: number, personelId: string) => {
    if (!onFieldChange) return;
    const p = personelList.find(
      (item: any) => String(item.id || item.ad_soyad) === personelId,
    );
    if (!p) return;
    const cleanName = cleanPersonelName(p.ad_soyad);
    const updated = [...activeRota];
    updated[idx] = {
      ...updated[idx],
      a: cleanName,
      u: p.unvan || updated[idx]?.u || "",
    };
    onFieldChange("rota", updated);
  };

  const handleAddStep = () => {
    if (!onFieldChange) return;
    const today = toTrDate(new Date());
    const updated = [
      ...activeRota,
      {
        t: activeRota.length === 0 ? "Hazırlayan" : "Paraf",
        a: "",
        u: "",
        tarih: today,
      },
    ];
    onFieldChange("rota", updated);
  };

  const handleDeleteStep = (idx: number) => {
    if (!onFieldChange) return;
    const updated = activeRota.filter((_, i) => i !== idx);
    onFieldChange("rota", updated);
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    if (!onFieldChange) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === activeRota.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...activeRota];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    onFieldChange("rota", updated);
  };

  const handleInitializeDefaultRota = () => {
    if (!onFieldChange) return;
    const today = toTrDate(new Date());
    const initialRota: RotaItem[] = [];
    const hName = data?.hazirlayanPersonelAdi ||
      (personelList[0]?.ad_soyad ? cleanPersonelName(personelList[0].ad_soyad) : "");
    const hUnvan = data?.hazirlayanPersonelUnvan ||
      personelList[0]?.unvan || "Görevli Personel";
    initialRota.push({ t: "Hazırlayan", a: hName, u: hUnvan, tarih: today });

    if (personelList.length > 1) {
      initialRota.push({
        t: "Paraf",
        a: cleanPersonelName(personelList[1].ad_soyad),
        u: personelList[1].unvan || "Birim Yetkilisi",
        tarih: today,
      });
    } else {
      initialRota.push({ t: "Paraf", a: "", u: "Birim Yetkilisi", tarih: today });
    }

    if (data?.onaylayanPersonelAdi) {
      initialRota.push({
        t: "İmza",
        a: data.onaylayanPersonelAdi,
        u: data.onaylayanPersonelUnvan || "Harcama Yetkilisi",
        tarih: today,
      });
    }
    onFieldChange("belgeModu", "koordinasyonlu");
    onFieldChange("rota", initialRota);
  };

  // Eğer koordinasyonlu mod aktif değilse ve liste boşsa
  if (items.length === 0 && effectiveMode !== "koordinasyonlu") {
    if (isEditing) {
      return (
        <div
          style={{
            marginTop: `${marginTop}px`,
            textAlign: "center",
            padding: "4px",
            pageBreakInside: "avoid",
          }}
        >
          <button
            type="button"
            onClick={handleInitializeDefaultRota}
            style={{
              fontSize: "7.5pt",
              color: "#2563eb",
              backgroundColor: "#f8fafc",
              border: "1px dashed #93c5fd",
              borderRadius: "4px",
              padding: "3px 10px",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Belgeye alt paraf / koordinasyon tablosu ekle"
          >
            ⚡ + Paraf &amp; Koordinasyon Akışı Ekle
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      style={{
        marginTop: `${marginTop}px`,
        pageBreakInside: "avoid",
        breakInside: "avoid",
        width: "100%",
        borderTop: "1px dashed #cbd5e1",
        paddingTop: "8px",
      }}
    >
      {items.length === 0 ? (
        <div
          style={{
            fontSize: "8pt",
            color: "#64748b",
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "6px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            Koordinasyonlu mod aktif ancak henüz adım eklenmedi.
          </div>
          {isEditing && (
            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleInitializeDefaultRota}
                style={{
                  fontSize: "7.5pt",
                  padding: "3px 8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ⚡ Otomatik Rota Oluştur
              </button>
              <button
                type="button"
                onClick={handleAddStep}
                style={{
                  fontSize: "7.5pt",
                  padding: "3px 8px",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
              >
                + Boş Adım Ekle
              </button>
            </div>
          )}
        </div>
      ) : isEditing ? (
        /* ================= CANLI DÜZENLEME MODU ================= */
        <div style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "8pt",
                fontWeight: 700,
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              🔀 Belge Koordinasyon / Paraf Akışı ({items.length} Adım)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={handleAddStep}
                style={{
                  fontSize: "7pt",
                  padding: "2px 6px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                + Adım Ekle
              </button>
              <button
                type="button"
                onClick={() => onFieldChange && onFieldChange("belgeModu", "standart")}
                style={{
                  fontSize: "7pt",
                  padding: "2px 6px",
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
                title="Standart moda dön ve tabloyu gizle"
              >
                ✕ Standart Moda Dön
              </button>
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "7.5pt",
              lineHeight: 1.35,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                <th style={{ textAlign: "left", padding: "2px 4px", width: "75px" }}>Tarih</th>
                <th style={{ textAlign: "left", padding: "2px 4px", width: "95px" }}>İşlem / Rol</th>
                <th style={{ textAlign: "left", padding: "2px 4px" }}>Adı Soyadı &amp; Personel</th>
                <th style={{ textAlign: "left", padding: "2px 4px" }}>Unvanı</th>
                <th style={{ textAlign: "center", padding: "2px 4px", width: "60px" }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {activeRota.map((r, idx) => {
                const matchedPersonel = personelList.find(
                  (p: any) =>
                    p.ad_soyad &&
                    String(p.ad_soyad).trim().toLowerCase() ===
                      String(r.a || "").trim().toLowerCase(),
                );
                return (
                  <tr key={idx} style={{ borderBottom: "1px dotted #e2e8f0" }}>
                    <td style={{ padding: "2px 4px" }}>
                      <input
                        type="text"
                        value={r.tarih || ""}
                        onChange={(e) => handleUpdateStep(idx, "tarih", e.target.value)}
                        style={{
                          width: "70px",
                          fontSize: "7pt",
                          padding: "1px 3px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "3px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      <select
                        value={r.t || "Paraf"}
                        onChange={(e) => handleUpdateStep(idx, "t", e.target.value)}
                        style={{
                          fontSize: "7pt",
                          padding: "1px 3px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "3px",
                          width: "90px",
                          fontWeight: 600,
                        }}
                      >
                        <option value="Hazırlayan">Hazırlayan</option>
                        <option value="Paraf">Paraf</option>
                        <option value="Koordinasyon">Koordinasyon</option>
                        <option value="Kontrol">Kontrol</option>
                        <option value="İmza">İmza</option>
                        <option value="Olur">Olur</option>
                      </select>
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <select
                          value={matchedPersonel ? String(matchedPersonel.id) : ""}
                          onChange={(e) => handleSelectPersonel(idx, e.target.value)}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "3px",
                            backgroundColor: "#f8fafc",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">👤 Personel Seç...</option>
                          {personelList.map((p: any) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ""}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={r.a || ""}
                          onChange={(e) => handleUpdateStep(idx, "a", e.target.value)}
                          placeholder="Adı Soyadı"
                          style={{
                            fontSize: "7pt",
                            padding: "1px 3px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "3px",
                            fontWeight: 600,
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      <input
                        type="text"
                        value={r.u || ""}
                        onChange={(e) => handleUpdateStep(idx, "u", e.target.value)}
                        placeholder="Unvanı"
                        style={{
                          width: "100%",
                          fontSize: "7pt",
                          padding: "1px 3px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "3px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "2px 4px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "up")}
                          disabled={idx === 0}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "2px",
                            backgroundColor: idx === 0 ? "#f1f5f9" : "#fff",
                            cursor: idx === 0 ? "default" : "pointer",
                          }}
                          title="Yukarı Taşı"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "down")}
                          disabled={idx === activeRota.length - 1}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "2px",
                            backgroundColor: idx === activeRota.length - 1 ? "#f1f5f9" : "#fff",
                            cursor: idx === activeRota.length - 1 ? "default" : "pointer",
                          }}
                          title="Aşağı Taşı"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(idx)}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #fca5a5",
                            borderRadius: "2px",
                            backgroundColor: "#fef2f2",
                            color: "#b91c1c",
                            cursor: "pointer",
                          }}
                          title="Adımı Sil"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= RESMÎ / BASKI / ÖNİZLEME MODU ================= */
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "7.5pt",
            lineHeight: 1.35,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
              <th style={{ textAlign: "left", padding: "2px 4px", width: "80px" }}>Tarih</th>
              <th style={{ textAlign: "left", padding: "2px 4px", width: "90px" }}>İşlem / Rol</th>
              <th style={{ textAlign: "left", padding: "2px 4px" }}>Unvanı</th>
              <th style={{ textAlign: "left", padding: "2px 4px" }}>Adı Soyadı</th>
              <th style={{ textAlign: "center", padding: "2px 4px", width: "70px" }}>Paraf / İmza</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: "1px dotted #f1f5f9" }}>
                <td style={{ padding: "2px 4px", color: "#334155" }}>{it.tarih}</td>
                <td style={{ padding: "2px 4px", fontWeight: "600", color: "#1e293b" }}>{it.tur}</td>
                <td style={{ padding: "2px 4px", color: "#475569" }}>{it.unvan || "-"}</td>
                <td style={{ padding: "2px 4px", fontWeight: "500", color: "#0f172a" }}>{it.adSoyad || "-"}</td>
                <td style={{ padding: "2px 4px", textAlign: "center", color: "#94a3b8", fontSize: "7pt" }}>
                  (Paraf)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
