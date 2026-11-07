/**
 * ROTA <-> BELGE VERİSİ (CommonDocumentFields / formData) KÖPRÜSÜ
 * Belge şablonlarının (.template.tsx) kendi içlerinde ekstra rota tablosu göstermeden,
 * çözülmüş rota değerlerini doğrudan kendi standart personel/birim alanlarında
 * (hazirlayanPersonelAdi, onaylayanPersonelAdi, komisyonUyeleri, fiyatArastirmaGorevlileri,
 * muayeneKomisyonu, sunulacakMakamAdi vb.) kullanmasını sağlar.
 */
import type {
  ResolvedDocumentRoute,
  RouteAssignee,
  RouteOverride,
  RouteSlotDefinition,
  RouteValue,
  RouteValues,
  TemplateRouteDefinition,
} from "@temin360/contracts";

function toAssignee(
  name?: string | null,
  title?: string | null,
  id?: string | number | null,
  role?: string | null,
): RouteAssignee | null {
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return null;
  return {
    id: id !== undefined && id !== null && String(id).trim() !== "" ? String(id) : `person_${cleanName}`,
    name: cleanName,
    title: typeof title === "string" ? title.trim() : undefined,
    role: typeof role === "string" ? role.trim() : undefined,
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
      obj.unvan ||
      obj.personel_unvan ||
      obj.title ||
      obj.u ||
      obj.onaylayanPersonelUnvan ||
      "";
    const role = obj.gorevi || obj.gorev || obj.rol || obj.role || obj.t || "";
    const id = obj.id ?? obj.personel_id ?? `person_${String(name).trim()}`;
    const assignee = toAssignee(name, title, id, role);
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
    const primaryKey = slot.fieldKey || slot.id;
    const rawArr =
      (Array.isArray(data[primaryKey]) && data[primaryKey].length > 0
        ? data[primaryKey]
        : null) ||
      (slot.id === "fiyatArastirmaGorevlileri" || slot.fieldKey === "fiyatArastirmaGorevlileri"
        ? data.fiyatArastirmaGorevlileri || data.komisyon || data.fiyatKomisyonu || data.gorevliler
        : slot.id === "muayeneKomisyonu" || slot.fieldKey === "muayeneKomisyonu"
        ? data.muayeneKomisyonu || data.komisyon
        : data.komisyonUyeleri || data.komisyon || data.gorevlendirilenler);

    const list = toAssigneeList(rawArr);
    return list.length > 0 ? list : null;
  }

  if (slot.kind === "unit") {
    const key = slot.fieldKey || (slot.id === "ihtiyacYeri" ? "ihtiyacYeri" : "sunulacakMakamAdi");
    const rawUnit =
      data[key] ||
      (key === "sunulacakMakamAdi"
        ? data.sunulacakMakam || data.muhatapBirim || data.vmakamina
        : data.harcamaBirimi);
    if (typeof rawUnit === "string" && rawUnit.trim() !== "") {
      return {
        id: `unit_${rawUnit.trim()}`,
        name: rawUnit.trim(),
      };
    }
    return null;
  }

  // kind === "person"
  if (slot.id === "hazirlayan" || slot.fieldKey === "hazirlayanPersonelAdi") {
    return toAssignee(
      data.hazirlayanPersonelAdi || data.talepEdenPersonelAdi,
      data.hazirlayanPersonelUnvan || data.talepEdenPersonelUnvan,
      data.hazirlayanPersonelId,
      "Hazırlayan",
    );
  }

  if (slot.id === "onaylayan" || slot.fieldKey === "onaylayanPersonelAdi") {
    return toAssignee(
      data.onaylayanPersonelAdi || data.baskanAdi || data.harcamaYetkilisiAdi,
      data.onaylayanPersonelUnvan || data.baskanUnvan || data.harcamaYetkilisiUnvan,
      data.onaylayanPersonelId,
      "Onaylayan",
    );
  }

  if (
    slot.id === "gerceklestirmeGorevlisi" ||
    slot.fieldKey === "gerceklestirmeGorevlisiAdi"
  ) {
    return toAssignee(
      data.gerceklestirmeGorevlisiAdi || data.hazirlayanPersonelAdi,
      data.gerceklestirmeGorevlisiUnvani ||
        data.gerceklestirmeGorevlisiUnvan ||
        data.hazirlayanPersonelUnvan,
      data.gerceklestirmeGorevlisiId,
      "Gerçekleştirme Görevlisi",
    );
  }

  if (slot.id === "kontrolGorevlisi" || slot.fieldKey === "kontrolPersonelAdi") {
    return toAssignee(
      data.kontrolPersonelAdi,
      data.kontrolPersonelUnvan,
      data.kontrolPersonelId,
      "Kontrol Görevlisi",
    );
  }

  const nameKey = slot.fieldKey || `${slot.id}PersonelAdi`;
  const titleKey = slot.titleFieldKey || `${slot.id}PersonelUnvan`;
  return toAssignee(data[nameKey], data[titleKey], undefined, slot.label);
}

/**
 * Çözülmüş belge rotasının (ResolvedDocumentRoute) adımlarını belge verisine (formData)
 * standart alan isimleriyle yazar. Böylece .template.tsx şablonları hiçbir değişiklik
 * gerektirmeden kendi PersonelCard / ApprovalSignature / komisyon alanlarında sonucu gösterir.
 */
export function applyResolvedRouteToDocumentData<T extends Record<string, any>>(
  data: T,
  resolvedRoute: ResolvedDocumentRoute,
): T {
  const next: Record<string, any> = {
    ...data,
    resolvedRoute,
  };

  for (const step of resolvedRoute.steps) {
    if (step.value === null) continue;

    if (step.kind === "person-list" && Array.isArray(step.value)) {
      const mappedMembers = step.value.map((person, idx) => ({
        id: person.id,
        adSoyad: person.name,
        ad_soyad: person.name,
        unvan: person.title || "",
        gorevi:
          person.role ||
          (idx === 0 && step.value && (step.value as RouteAssignee[]).length > 1
            ? "Başkan"
            : "Üye"),
      }));

      const targetKey = step.fieldKey || step.id;
      next[targetKey] = mappedMembers;

      if (
        targetKey === "fiyatArastirmaGorevlileri" ||
        step.id === "fiyatArastirmaGorevlileri" ||
        resolvedRoute.templateId.includes("piyasa-fiyat") ||
        resolvedRoute.templateId === "teklif_cetveli"
      ) {
        next.fiyatArastirmaGorevlileri = mappedMembers;
        next.komisyon = mappedMembers;
        next.fiyatKomisyonu = mappedMembers;
      } else if (
        targetKey === "muayeneKomisyonu" ||
        step.id === "muayeneKomisyonu"
      ) {
        next.muayeneKomisyonu = mappedMembers;
        next.komisyon = mappedMembers;
      } else {
        next.komisyonUyeleri = mappedMembers;
        next.komisyon = mappedMembers;
      }
      continue;
    }

    if (step.kind === "unit" && !Array.isArray(step.value)) {
      const unitName = step.value.name;
      const targetKey =
        step.fieldKey ||
        (step.id === "ihtiyacYeri" ? "ihtiyacYeri" : "sunulacakMakamAdi");
      next[targetKey] = unitName;
      if (targetKey === "sunulacakMakamAdi") {
        next.sunulacakMakam = unitName;
        next.muhatapBirim = unitName;
      }
      continue;
    }

    if (step.kind === "person" && !Array.isArray(step.value)) {
      const person = step.value;
      if (step.id === "hazirlayan" || step.fieldKey === "hazirlayanPersonelAdi") {
        next.hazirlayanPersonelAdi = person.name;
        if (person.title !== undefined) {
          next.hazirlayanPersonelUnvan = person.title;
        }
      } else if (
        step.id === "onaylayan" ||
        step.fieldKey === "onaylayanPersonelAdi"
      ) {
        next.onaylayanPersonelAdi = person.name;
        next.baskanAdi = person.name;
        next.harcamaYetkilisiAdi = person.name;
        if (person.title !== undefined) {
          next.onaylayanPersonelUnvan = person.title;
          next.baskanUnvan = person.title;
          next.harcamaYetkilisiUnvan = person.title;
        }
      } else if (
        step.id === "gerceklestirmeGorevlisi" ||
        step.fieldKey === "gerceklestirmeGorevlisiAdi"
      ) {
        next.gerceklestirmeGorevlisiAdi = person.name;
        next.hazirlayanPersonelAdi = next.hazirlayanPersonelAdi || person.name;
        if (person.title !== undefined) {
          next.gerceklestirmeGorevlisiUnvani = person.title;
          next.gerceklestirmeGorevlisiUnvan = person.title;
          next.hazirlayanPersonelUnvan =
            next.hazirlayanPersonelUnvan || person.title;
        }
      } else if (
        step.id === "kontrolGorevlisi" ||
        step.fieldKey === "kontrolPersonelAdi"
      ) {
        next.kontrolPersonelAdi = person.name;
        if (person.title !== undefined) {
          next.kontrolPersonelUnvan = person.title;
        }
      } else if (step.fieldKey) {
        next[step.fieldKey] = person.name;
        if (step.titleFieldKey && person.title !== undefined) {
          next[step.titleFieldKey] = person.title;
        }
      }
    }
  }

  return next as T;
}

export type { RouteOverride };

