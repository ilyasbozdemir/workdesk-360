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
  birim?: string;
  birim_id?: number | string | null;
  aktif_mi?: number | boolean | null;
}

export interface BirimPersonelFilterOptions {
  birimId?: number | string | null;
  birimAdi?: string | null;
  birimList?: any[];
  includeOtherUnits?: boolean;
  includePassive?: boolean;
  currentSelectedNames?: string[];
}

export interface BirimPersonelFilterResult {
  primaryUnitPersonel: MergedPersonelItem[];
  otherUnitPersonel: MergedPersonelItem[];
  filteredList: MergedPersonelItem[];
  hasUnitDataInPool: boolean;
  matchedBirim: Record<string, any> | null;
}

export interface BirimPersonelValidationWarning {
  type:
    | "birim_not_found"
    | "birim_passive"
    | "personel_passive"
    | "personel_different_birim";
  message: string;
  slotId?: string;
  slotLabel?: string;
  personelName?: string;
  personelBirim?: string;
  expectedBirim?: string;
}

export function isPersonelActive(person: any): boolean {
  if (!person || typeof person !== "object") return true;
  const val = person.aktif_mi ?? person.is_active ?? person.aktif;
  if (val === 0 || val === "0" || val === false || val === "false") {
    return false;
  }
  return true;
}

function normalizeUnitText(val: unknown): string {
  return String(val ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
}

export function findBirimInList(
  birimId?: number | string | null,
  birimAdi?: string | null,
  birimList?: any[],
): Record<string, any> | null {
  if (!Array.isArray(birimList) || birimList.length === 0) return null;

  const hasId =
    birimId !== undefined &&
    birimId !== null &&
    String(birimId).trim() !== "" &&
    Number(birimId) !== 0;

  if (hasId) {
    const byId = birimList.find(
      (b: any) =>
        b &&
        (Number(b.id) === Number(birimId) ||
          String(b.id).trim() === String(birimId).trim()),
    );
    if (byId) return byId;
  }

  const cleanAdi = normalizeUnitText(birimAdi);
  if (cleanAdi) {
    const byName = birimList.find((b: any) => {
      if (!b) return false;
      return [b.birim_adi, b.ad, b.kisa_ad, b.antet_ek_satir]
        .filter(Boolean)
        .some((candidate) => normalizeUnitText(candidate) === cleanAdi);
    });
    if (byName) return byName;
  }

  return null;
}

export function doesPersonelBelongToBirim(
  person: any,
  birimRecordOrId?: any,
  birimList?: any[],
  fallbackBirimAdi?: string | null,
): boolean {
  if (!person) return false;

  const targetBirim =
    birimRecordOrId && typeof birimRecordOrId === "object"
      ? birimRecordOrId
      : findBirimInList(
          typeof birimRecordOrId === "number" || typeof birimRecordOrId === "string"
            ? birimRecordOrId
            : undefined,
          fallbackBirimAdi ||
            (typeof birimRecordOrId === "string" && isNaN(Number(birimRecordOrId))
              ? birimRecordOrId
              : undefined),
          birimList,
        );

  const pBirimId = person.birim_id ?? person.birimId;
  if (targetBirim?.id !== undefined && targetBirim?.id !== null) {
    if (pBirimId !== undefined && pBirimId !== null && String(pBirimId).trim() !== "") {
      if (Number(pBirimId) === Number(targetBirim.id)) return true;
    }
    const personIdNum = Number(person.id);
    if (!isNaN(personIdNum) && personIdNum > 0) {
      if (
        Number(targetBirim.harcama_yetkilisi_id) === personIdNum ||
        Number(targetBirim.gerceklestirme_gorevlisi_id) === personIdNum ||
        Number(targetBirim.ilgili_personel_id) === personIdNum
      ) {
        return true;
      }
    }
  } else if (
    (typeof birimRecordOrId === "number" ||
      (typeof birimRecordOrId === "string" && !isNaN(Number(birimRecordOrId)))) &&
    pBirimId !== undefined &&
    pBirimId !== null
  ) {
    if (Number(pBirimId) === Number(birimRecordOrId)) return true;
  }

  const pBirimText = normalizeUnitText(
    person.birim || person.birim_adi || person.birimAdi,
  );
  if (!pBirimText) return false;

  const candidateNames = new Set<string>();
  if (targetBirim) {
    [
      targetBirim.birim_adi,
      targetBirim.ad,
      targetBirim.kisa_ad,
      targetBirim.antet_ek_satir,
      targetBirim.id !== undefined ? String(targetBirim.id) : "",
    ]
      .map(normalizeUnitText)
      .filter(Boolean)
      .forEach((n) => candidateNames.add(n));
  }
  if (fallbackBirimAdi) {
    const normFallback = normalizeUnitText(fallbackBirimAdi);
    if (normFallback) candidateNames.add(normFallback);
  }
  if (typeof birimRecordOrId === "string" || typeof birimRecordOrId === "number") {
    const normRaw = normalizeUnitText(birimRecordOrId);
    if (normRaw) candidateNames.add(normRaw);
  }

  if (candidateNames.has(pBirimText)) {
    return true;
  }

  return false;
}

/**
 * Personel havuzunu seçili birime (birimId / birimAdi) göre varsayılan olarak filtreler;
 * istenirse yetkili diğer birim personellerini de ikinci grup olarak dahil eder.
 */
export function filterPersonelByBirim(
  personelList: MergedPersonelItem[],
  options: BirimPersonelFilterOptions = {},
): BirimPersonelFilterResult {
  const {
    birimId,
    birimAdi,
    birimList = [],
    includeOtherUnits = false,
    includePassive = false,
    currentSelectedNames = [],
  } = options;

  const selectedNameSet = new Set(
    currentSelectedNames
      .map((n) => cleanPersonelName(n).toLocaleLowerCase("tr-TR"))
      .filter(Boolean),
  );

  const matchedBirim = findBirimInList(birimId, birimAdi, birimList);
  const hasTargetUnit = Boolean(
    matchedBirim ||
      (birimId !== undefined &&
        birimId !== null &&
        String(birimId).trim() !== "" &&
        Number(birimId) !== 0) ||
      (birimAdi && String(birimAdi).trim() !== ""),
  );

  const activePool = personelList.filter((p) => {
    if (includePassive) return true;
    const isCurrent = selectedNameSet.has(
      cleanPersonelName(p.ad_soyad).toLocaleLowerCase("tr-TR"),
    );
    return isCurrent || isPersonelActive(p);
  });

  const hasUnitDataInPool = activePool.some(
    (p) =>
      Boolean(p.birim && String(p.birim).trim() !== "") ||
      (p.birim_id !== undefined &&
        p.birim_id !== null &&
        String(p.birim_id).trim() !== "") ||
      Boolean(
        matchedBirim &&
          (Number(p.id) === Number(matchedBirim.harcama_yetkilisi_id) ||
            Number(p.id) === Number(matchedBirim.gerceklestirme_gorevlisi_id) ||
            Number(p.id) === Number(matchedBirim.ilgili_personel_id)),
      ),
  );

  if (!hasTargetUnit || !hasUnitDataInPool) {
    return {
      primaryUnitPersonel: activePool,
      otherUnitPersonel: [],
      filteredList: activePool,
      hasUnitDataInPool,
      matchedBirim,
    };
  }

  const primaryUnitPersonel: MergedPersonelItem[] = [];
  const otherUnitPersonel: MergedPersonelItem[] = [];

  for (const p of activePool) {
    if (
      doesPersonelBelongToBirim(
        p,
        matchedBirim || birimId,
        birimList,
        birimAdi,
      )
    ) {
      primaryUnitPersonel.push(p);
    } else {
      otherUnitPersonel.push(p);
    }
  }

  if (includeOtherUnits || primaryUnitPersonel.length === 0) {
    return {
      primaryUnitPersonel,
      otherUnitPersonel,
      filteredList: [...primaryUnitPersonel, ...otherUnitPersonel],
      hasUnitDataInPool,
      matchedBirim,
    };
  }

  // Varsayılan: Sadece ilgili birim personeli + halihazırda seçili olan manuel görevliler (silinmemesi için)
  const keptSelectedOthers = otherUnitPersonel.filter((p) =>
    selectedNameSet.has(cleanPersonelName(p.ad_soyad).toLocaleLowerCase("tr-TR")),
  );

  return {
    primaryUnitPersonel,
    otherUnitPersonel,
    filteredList: [...primaryUnitPersonel, ...keptSelectedOthers],
    hasUnitDataInPool,
    matchedBirim,
  };
}

/**
 * Birim değiştiğinde veya belge açıldığında mevcut manuel görevli seçimlerini SİLMEDEN,
 * seçili birime ait olmayan, pasif olan veya bulunamayan birim/personel durumlarını denetler.
 */
export function validateBirimAndPersonelAssignments(options: {
  birimId?: number | string | null;
  birimAdi?: string | null;
  birimList?: any[];
  personelList?: any[];
  assignedPersons?: Array<{
    slotId: string;
    slotLabel: string;
    name: string;
    id?: string | number | null;
  }>;
}): BirimPersonelValidationWarning[] {
  const {
    birimId,
    birimAdi,
    birimList = [],
    personelList = [],
    assignedPersons = [],
  } = options;

  const warnings: BirimPersonelValidationWarning[] = [];
  const hasExplicitBirimId =
    birimId !== undefined &&
    birimId !== null &&
    String(birimId).trim() !== "" &&
    Number(birimId) !== 0;

  const matchedBirim = findBirimInList(birimId, birimAdi, birimList);

  if (hasExplicitBirimId && !matchedBirim && birimList.length > 0) {
    warnings.push({
      type: "birim_not_found",
      message: `Seçili birim (ID: ${birimId}) birim tanımlarında bulunamadı. Güvenli varsayılan kurum anteti kullanılıyor.`,
    });
  } else if (
    matchedBirim &&
    (matchedBirim.aktif_mi === 0 ||
      matchedBirim.aktif_mi === "0" ||
      matchedBirim.aktif_mi === false ||
      matchedBirim.is_active === 0 ||
      matchedBirim.is_active === false)
  ) {
    const bName = matchedBirim.birim_adi || matchedBirim.ad || String(birimId);
    warnings.push({
      type: "birim_passive",
      message: `"${bName}" birimi pasif durumdadır.`,
      expectedBirim: bName,
    });
  }

  const expectedBirimName =
    matchedBirim?.birim_adi || matchedBirim?.ad || birimAdi || "";

  for (const assigned of assignedPersons) {
    const cleanName = cleanPersonelName(assigned.name);
    if (!cleanName) continue;

    const rawMatch = personelList.find((p: any) => {
      if (!p) return false;
      if (
        assigned.id !== undefined &&
        assigned.id !== null &&
        !String(assigned.id).startsWith("person_") &&
        !String(assigned.id).startsWith("personel_") &&
        !String(assigned.id).startsWith("custom_") &&
        Number(p.id) === Number(assigned.id)
      ) {
        return true;
      }
      const pName = cleanPersonelName(p.ad_soyad || p.adSoyad || p.name);
      return (
        pName.toLocaleLowerCase("tr-TR") === cleanName.toLocaleLowerCase("tr-TR")
      );
    });

    if (!rawMatch) continue;

    if (!isPersonelActive(rawMatch)) {
      warnings.push({
        type: "personel_passive",
        slotId: assigned.slotId,
        slotLabel: assigned.slotLabel,
        personelName: cleanName,
        message: `${cleanName} (${assigned.slotLabel}) personel kaydı pasif durumdadır.`,
      });
    }

    const rawPersonBirim = rawMatch.birim || rawMatch.birim_adi || rawMatch.birimAdi;
    const rawPersonBirimId = rawMatch.birim_id ?? rawMatch.birimId;
    const personHasUnitInfo = Boolean(
      (rawPersonBirim && String(rawPersonBirim).trim() !== "") ||
        (rawPersonBirimId !== undefined &&
          rawPersonBirimId !== null &&
          String(rawPersonBirimId).trim() !== ""),
    );

    if (
      (matchedBirim || hasExplicitBirimId || expectedBirimName) &&
      personHasUnitInfo &&
      !doesPersonelBelongToBirim(
        rawMatch,
        matchedBirim || birimId,
        birimList,
        expectedBirimName,
      )
    ) {
      const personUnitLabel =
        rawPersonBirim ||
        birimList.find((b: any) => Number(b?.id) === Number(rawPersonBirimId))
          ?.birim_adi ||
        `Birim #${rawPersonBirimId}`;
      warnings.push({
        type: "personel_different_birim",
        slotId: assigned.slotId,
        slotLabel: assigned.slotLabel,
        personelName: cleanName,
        personelBirim: String(personUnitLabel),
        expectedBirim: String(expectedBirimName || birimId || ""),
        message: `${cleanName} (${assigned.slotLabel}) seçili birimden (${expectedBirimName || birimId}) farklı bir birime (${personUnitLabel}) kayıtlıdır.`,
      });
    }
  }

  return warnings;
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

    const key = cleanName.toLocaleLowerCase("tr-TR");
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
    const birim =
      rawObj.birim ||
      rawObj.birim_adi ||
      rawObj.birimAdi ||
      item.birim ||
      undefined;
    const birim_id =
      rawObj.birim_id ?? rawObj.birimId ?? item.birim_id ?? item.birimId ?? null;
    const aktif_mi =
      rawObj.aktif_mi ?? rawObj.is_active ?? item.aktif_mi ?? item.is_active ?? 1;
    const isPassive = !isPersonelActive({ aktif_mi });
    const baseLabel = unvan ? `${cleanName} (${unvan})` : cleanName;
    const label = isPassive ? `${baseLabel} [Pasif]` : baseLabel;

    const existing = seenMap.get(key);
    if (!existing) {
      seenMap.set(key, {
        id,
        ad_soyad: cleanName,
        unvan,
        label,
        rol: item.rol || item.t,
        birim,
        birim_id,
        aktif_mi,
      });
    } else {
      if (!existing.unvan && unvan) {
        existing.unvan = unvan;
        const pPassive = !isPersonelActive(existing);
        const bLabel = `${existing.ad_soyad} (${unvan})`;
        existing.label = pPassive ? `${bLabel} [Pasif]` : bLabel;
      }
      if (!existing.birim && birim) {
        existing.birim = birim;
      }
      if ((existing.birim_id === null || existing.birim_id === undefined) && birim_id !== null && birim_id !== undefined) {
        existing.birim_id = birim_id;
      }
      if (rawObj.aktif_mi !== undefined || rawObj.is_active !== undefined) {
        existing.aktif_mi = aktif_mi;
        if (!isPersonelActive({ aktif_mi }) && !existing.label.includes("[Pasif]")) {
          existing.label = `${existing.label} [Pasif]`;
        }
      }
      if (
        String(existing.id).startsWith("personel_") &&
        !String(id).startsWith("personel_")
      ) {
        existing.id = id;
      }
    }
  }

  let personelList = Array.from(seenMap.values());

  const cleanCurrent = cleanPersonelName(currentAdSoyad);
  if (
    cleanCurrent &&
    !personelList.some(
      (p) =>
        p.ad_soyad.toLocaleLowerCase("tr-TR") ===
        cleanCurrent.toLocaleLowerCase("tr-TR"),
    )
  ) {
    const u = String(currentUnvan || "").trim();
    personelList.unshift({
      id: `custom_${cleanCurrent}`,
      ad_soyad: cleanCurrent,
      unvan: u,
      label: u ? `${cleanCurrent} (${u})` : cleanCurrent,
      aktif_mi: 1,
    });
  }

  // Pasif personelleri (mevcut seçili olan hariç) varsayılan listeden süz
  personelList = personelList.filter((p) => {
    if (!p || !p.ad_soyad || p.ad_soyad.trim() === "") return false;
    if (
      cleanCurrent &&
      p.ad_soyad.toLocaleLowerCase("tr-TR") === cleanCurrent.toLocaleLowerCase("tr-TR")
    ) {
      return true;
    }
    return isPersonelActive(p);
  });

  // Belgede birim bilgisi varsa ilgili birim personellerini önceliklendir
  if (data && (data.birimId || data.birim_id || data.birimAdi || data.birim || data.mudurluk)) {
    const { filteredList } = filterPersonelByBirim(personelList, {
      birimId: data.birimId ?? data.birim_id,
      birimAdi: data.birimAdi || data.birim || data.mudurluk,
      birimList: data.birimListesi,
      includeOtherUnits: data.allowCrossUnitPersonnel !== false,
      currentSelectedNames: cleanCurrent ? [cleanCurrent] : [],
    });
    return filteredList;
  }

  return personelList;
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

  const effectiveAdSoyad =
    adSoyad ||
    (data && nameField ? data[nameField] : "") ||
    "";
  const effectiveUnvan =
    unvan ||
    (data && unvanField ? data[unvanField] : "") ||
    "";

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
        {isEditing && (isFirmaSelect ? validFirmaList.length > 0 : personelList.length > 0) && (
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
