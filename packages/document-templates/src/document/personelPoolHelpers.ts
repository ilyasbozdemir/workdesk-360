import { cleanPersonelName } from "../utils/textHelpers";

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
      if (
        (existing.birim_id === null || existing.birim_id === undefined) &&
        birim_id !== null &&
        birim_id !== undefined
      ) {
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

