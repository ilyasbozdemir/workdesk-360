/**
 * ROTA <-> BELGE VERİSİ (CommonDocumentFields / formData) KÖPRÜSÜ
 * Belge şablonlarının (.template.tsx) kendi içlerinde ekstra rota tablosu göstermeden,
 * çözülmüş rota değerlerini doğrudan kendi standart personel/birim alanlarında
 * (hazirlayanPersonelAdi, onaylayanPersonelAdi, komisyonUyeleri, fiyatArastirmaGorevlileri,
 * muayeneKomisyonu, sunulacakMakamAdi vb.) kullanmasını sağlar.
 *
 * MİMARİ İLKE:
 * Bu köprü şablona özel hardcoded kontrol (templateId.includes, sabit slot ID dallanması,
 * örtük alan kopyalaması veya antet mantığı) İÇERMEZ.
 * Hangi slotun nereye yazılacağı ve nereden okunacağı yalnızca şablonun açık
 * RouteSlotDefinition sözleşmesi (fieldKey, titleFieldKey, targetFieldKeys, sourceFieldKeys)
 * üzerinden yönetilir.
 */
import type {
  CommissionSignatureType,
  ResolvedDocumentRoute,
  RouteAssignee,
  RouteOverride,
  RouteSlotDefinition,
  RouteValue,
  RouteValues,
  TemplateRouteDefinition,
} from "./types";

function normalizeSigType(raw: unknown): CommissionSignatureType {
  if (typeof raw !== "string") return "İmza";
  const clean = raw.trim().toLocaleLowerCase("tr-TR");
  if (clean === "paraf") return "Paraf";
  if (clean === "koordinasyon" || clean === "koordine") return "Koordinasyon";
  return "İmza";
}

function isReserveAssignee(item: Record<string, any>): boolean {
  if (item.asilMi === 0 || item.asilMi === false || item.asil_mi === 0 || item.asil_mi === false) {
    return true;
  }
  const asliYedek = String(item.asliYedek ?? item.asli_yedek ?? "").trim().toLocaleLowerCase("tr-TR");
  if (asliYedek === "yedek" || asliYedek.includes("yedek")) return true;
  const roleStr = String(item.gorevi ?? item.gorev ?? item.rol ?? item.role ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  if (roleStr.includes("yedek")) return true;
  return false;
}

function toAssignee(
  name?: string | null,
  title?: string | null,
  id?: string | number | null,
  role?: string | null,
  extra?: Partial<RouteAssignee>,
): RouteAssignee | null {
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return null;
  return {
    id: id !== undefined && id !== null && String(id).trim() !== "" ? String(id) : `person_${cleanName}`,
    name: cleanName,
    title: typeof title === "string" ? title.trim() : undefined,
    role: typeof role === "string" ? role.trim() : undefined,
    ...extra,
  };
}

function toAssigneeList(rawList: unknown): RouteAssignee[] {
  if (!Array.isArray(rawList)) return [];
  const result: RouteAssignee[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;
    const obj = (item as any).personel || item;
    const name =
      obj.adSoyad ||
      obj.ad_soyad ||
      obj.name ||
      obj.a ||
      obj.onaylayanPersonelAdi ||
      "";
    const title =
      obj.vekalet_unvani ||
      obj.vekaletUnvani ||
      obj.unvan ||
      obj.personel_unvan ||
      obj.title ||
      obj.u ||
      obj.onaylayanPersonelUnvan ||
      "";
    // Komisyon görevi (Başkan, Üye, Yedek Üye vb.) imza türünden (Paraf, Koordinasyon, İmza) ayrıdır
    const rawRole = obj.gorevi || obj.gorev || obj.gorev_adi || obj.komisyonGorevi || obj.role || obj.rol || "";
    const role =
      rawRole && rawRole !== "Paraf" && rawRole !== "Koordinasyon" && rawRole !== "İmza"
        ? String(rawRole).trim()
        : "";
    const rawSig = obj.imzaTuru ?? obj.imza_turu ?? obj.signatureType;
    const imzaTuru = rawSig !== undefined && rawSig !== null ? normalizeSigType(rawSig) : undefined;
    const isReserve = isReserveAssignee(obj);
    const asilMi =
      obj.asilMi !== undefined ||
      obj.asil_mi !== undefined ||
      obj.asliYedek !== undefined ||
      obj.asli_yedek !== undefined ||
      isReserve
        ? isReserve
          ? 0
          : 1
        : undefined;
    const aktifKatilim =
      obj.aktifKatilim !== undefined || obj.aktif_katilim !== undefined || obj.yedek_aktif !== undefined
        ? Boolean(obj.aktifKatilim || obj.aktif_katilim || obj.yedek_aktif)
        : undefined;
    const unitId =
      obj.birim_id !== undefined && obj.birim_id !== null
        ? String(obj.birim_id)
        : obj.birimId !== undefined && obj.birimId !== null
        ? String(obj.birimId)
        : obj.unitId;
    const unitName = obj.birim || obj.birim_adi || obj.birimAdi || obj.unitName || undefined;

    const id = obj.id ?? obj.personel_id ?? `person_${String(name).trim()}`;
    const assignee = toAssignee(name, title, id, role, {
      ...(imzaTuru ? { imzaTuru } : {}),
      ...(asilMi !== undefined ? { asilMi } : {}),
      ...(aktifKatilim !== undefined ? { aktifKatilim } : {}),
      ...(unitId ? { unitId } : {}),
      ...(unitName ? { unitName } : {}),
    });
    if (assignee) {
      result.push(assignee);
    }
  }
  return result;
}

/**
 * Aktif dosya / belge verisinden (formData) şablonun rota slotlarına karşılık gelen
 * mevcut "document" kaynaklı RouteValues sözlüğünü çıkarır.
 */
export function extractDocumentRouteValues(
  data: Record<string, any> | undefined | null,
  definition: TemplateRouteDefinition,
): RouteValues {
  const values: RouteValues = {};
  if (!data) return values;

  for (const slot of definition.slots) {
    values[slot.id] = extractSlotValueFromData(data, slot);
  }
  return values;
}

export function extractSlotValueFromData(
  data: Record<string, any>,
  slot: RouteSlotDefinition,
): RouteValue {
  if (slot.kind === "person-list") {
    const candidateKeys: string[] = [];
    if (slot.fieldKey) candidateKeys.push(slot.fieldKey);
    if (!candidateKeys.includes(slot.id)) candidateKeys.push(slot.id);
    if (slot.sourceFieldKeys) {
      for (const key of slot.sourceFieldKeys) {
        if (!candidateKeys.includes(key)) candidateKeys.push(key);
      }
    }

    let rawArr: unknown = null;
    for (const key of candidateKeys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        rawArr = data[key];
        break;
      }
    }

    const list = toAssigneeList(rawArr);
    return list.length > 0 ? list : null;
  }

  if (slot.kind === "unit") {
    const candidateKeys: string[] = [];
    if (slot.fieldKey) candidateKeys.push(slot.fieldKey);
    if (!candidateKeys.includes(slot.id)) candidateKeys.push(slot.id);
    if (slot.sourceFieldKeys) {
      for (const key of slot.sourceFieldKeys) {
        if (!candidateKeys.includes(key)) candidateKeys.push(key);
      }
    }

    for (const key of candidateKeys) {
      const val = data[key];
      if (typeof val === "string" && val.trim() !== "") {
        return {
          id: `unit_${val.trim()}`,
          name: val.trim(),
        };
      }
    }
    return null;
  }

  // slot.kind === "person"
  const nameKeys: string[] = [];
  if (slot.fieldKey) nameKeys.push(slot.fieldKey);
  if (slot.sourceFieldKeys) {
    for (const key of slot.sourceFieldKeys) {
      if (!nameKeys.includes(key)) nameKeys.push(key);
    }
  }
  const defaultNameKey = `${slot.id}PersonelAdi`;
  if (!nameKeys.includes(defaultNameKey)) nameKeys.push(defaultNameKey);
  if (!nameKeys.includes(slot.id)) nameKeys.push(slot.id);

  let foundName: string | null = null;
  for (const key of nameKeys) {
    const val = data[key];
    if (typeof val === "string" && val.trim() !== "") {
      foundName = val.trim();
      break;
    }
  }

  const titleKeys: string[] = [];
  if (slot.titleFieldKey) titleKeys.push(slot.titleFieldKey);
  if (slot.sourceTitleFieldKeys) {
    for (const key of slot.sourceTitleFieldKeys) {
      if (!titleKeys.includes(key)) titleKeys.push(key);
    }
  }
  const defaultTitleKey = `${slot.id}PersonelUnvan`;
  if (!titleKeys.includes(defaultTitleKey)) titleKeys.push(defaultTitleKey);

  let foundTitle: string | undefined = undefined;
  for (const key of titleKeys) {
    const val = data[key];
    if (typeof val === "string" && val.trim() !== "") {
      foundTitle = val.trim();
      break;
    }
  }

  const idVal =
    data[`${slot.id}PersonelId`] ??
    (slot.fieldKey ? data[slot.fieldKey.replace(/Adi$/, "Id")] : undefined);

  return toAssignee(foundName, foundTitle, idVal, slot.label);
}

/**
 * Çözülmüş belge rotasının (ResolvedDocumentRoute) adımlarını belge verisine (formData)
 * standart alan isimleriyle yazar.
 *
 * MİMARİ İLKE:
 * Onaylayan, komisyon başkanı ve harcama yetkilisi gibi farklı kamu rolleri
 * kesinlikle otomatik olarak birbirine kopyalanmaz / eşitlenmez.
 * Yalnızca şablonun açık sözleşmesinde (fieldKey, titleFieldKey, targetFieldKeys, targetTitleFieldKeys)
 * tanımlı olan alanlar doldurulur.
 */
export function applyResolvedRouteToDocumentData<T extends Record<string, any>>(
  data: T,
  resolvedRoute: ResolvedDocumentRoute,
): T {
  const next: Record<string, any> = {
    ...data,
    resolvedRoute,
  };

  const isApptDoc = Boolean(resolvedRoute.isAppointmentDocument);

  for (const step of resolvedRoute.steps) {
    if (step.value === null) continue;

    if (step.kind === "person-list" && Array.isArray(step.value)) {
      const rawStepMembers = step.value as RouteAssignee[];

      const allMappedMembers = rawStepMembers.map((person, idx) => {
        const isRes = isReserveAssignee(person as any);
        const defaultRole =
          idx === 0 && rawStepMembers.length > 1 ? "Başkan" : isRes ? "Yedek Üye" : "Üye";
        const cleanRole =
          person.role &&
          person.role !== "Paraf" &&
          person.role !== "Koordinasyon" &&
          person.role !== "İmza"
            ? person.role
            : defaultRole;
        const sigType = normalizeSigType(person.imzaTuru);

        return {
          id: person.id,
          adSoyad: person.name,
          ad_soyad: person.name,
          unvan: person.title || "",
          gorevi: cleanRole,
          gorev: cleanRole,
          komisyonGorevi: cleanRole,
          rol: isRes ? "Yedek Üye" : cleanRole.toLocaleLowerCase("tr-TR").includes("başkan") ? "Başkan" : "Üye",
          asilMi: isRes ? 0 : 1,
          asil_mi: isRes ? 0 : 1,
          asliYedek: isRes ? "Yedek" : "Asil",
          asli_yedek: isRes ? "Yedek" : "Asil",
          imzaTuru: sigType,
          imza_turu: sigType,
          ...(person.unitId ? { birimId: person.unitId, birim_id: person.unitId } : {}),
          ...(person.unitName ? { birim: person.unitName } : {}),
          ...(person.aktifKatilim !== undefined ? { aktifKatilim: person.aktifKatilim } : {}),
        };
      });

      // Yedek üye kuralı: Görevlendirme belgeleri dışındaki evraklarda yedek üyeler,
      // yalnızca aktifKatilim === true ise imza alanına dahil edilir.
      const eligibleForDocument = allMappedMembers.filter(
        (m) => m.asilMi !== 0 || isApptDoc || Boolean(m.aktifKatilim),
      );

      // İmza türü 'Paraf' veya 'Koordinasyon' olan üyeleri rota akışına aktar;
      // ıslak imza alanına ('İmza' türündeki üyeler) yalnızca ıslak imzacıları yerleştir
      const wetSignatureMembers = isApptDoc
        ? eligibleForDocument
        : eligibleForDocument.filter((m) => m.imzaTuru === "İmza");

      const routeFlowMembers = eligibleForDocument.filter(
        (m) => m.imzaTuru === "Paraf" || m.imzaTuru === "Koordinasyon",
      );

      if (routeFlowMembers.length > 0) {
        const currentRota: any[] = Array.isArray(next.rota) ? [...next.rota] : [];
        for (const rm of routeFlowMembers) {
          const exists = currentRota.some(
            (r) =>
              String(r?.a || "")
                .trim()
                .toLocaleLowerCase("tr-TR") === rm.adSoyad.toLocaleLowerCase("tr-TR") &&
              String(r?.t || "")
                .trim()
                .toLocaleLowerCase("tr-TR") === rm.imzaTuru.toLocaleLowerCase("tr-TR"),
          );
          if (!exists) {
            currentRota.push({
              t: rm.imzaTuru,
              a: rm.adSoyad,
              u: rm.unvan,
              gorevi: rm.gorevi,
              sira: currentRota.length + 1,
            });
          }
        }
        next.rota = currentRota;
      }

      // Birincil hedef alanına yaz
      const primaryTargetKey = step.fieldKey || step.id;
      next[primaryTargetKey] = wetSignatureMembers;

      // Şablon sözleşmesinde açıkça belirtilmiş ek hedef alanlara yaz
      if (Array.isArray(step.targetFieldKeys)) {
        for (const targetKey of step.targetFieldKeys) {
          next[targetKey] = wetSignatureMembers;
        }
      }
      continue;
    }

    if (step.kind === "unit" && step.value && !Array.isArray(step.value)) {
      const unit = step.value as RouteAssignee;
      const unitName = unit.name;
      const primaryTargetKey = step.fieldKey || step.id;
      next[primaryTargetKey] = unitName;

      // Şablon sözleşmesinde açıkça belirtilmiş ek hedef alanlara yaz
      if (Array.isArray(step.targetFieldKeys)) {
        for (const targetKey of step.targetFieldKeys) {
          next[targetKey] = unitName;
        }
      }
      continue;
    }

    if (step.kind === "person" && step.value && !Array.isArray(step.value)) {
      const person = step.value as RouteAssignee;
      const primaryNameKey = step.fieldKey || `${step.id}PersonelAdi`;
      next[primaryNameKey] = person.name;

      const primaryTitleKey = step.titleFieldKey || `${step.id}PersonelUnvan`;
      if (person.title !== undefined) {
        next[primaryTitleKey] = person.title;
      }

      // Şablon sözleşmesinde açıkça belirtilmiş ek hedef isim alanlarına yaz
      if (Array.isArray(step.targetFieldKeys)) {
        for (const targetKey of step.targetFieldKeys) {
          next[targetKey] = person.name;
        }
      }

      // Şablon sözleşmesinde açıkça belirtilmiş ek hedef unvan alanlarına yaz
      if (Array.isArray(step.targetTitleFieldKeys)) {
        for (const targetTitleKey of step.targetTitleFieldKeys) {
          if (person.title !== undefined) {
            next[targetTitleKey] = person.title;
          }
        }
      }
    }
  }

  return next as T;
}

export type { RouteOverride };
