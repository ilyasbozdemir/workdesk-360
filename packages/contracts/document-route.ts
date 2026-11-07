/**
 * ORTAK ROTA SÖZLEŞMESİ
 * Bu dosyada iş mantığı, React veya SQL yoktur. Bütün belge şablonları aynı
 * veri biçimini kullansın diye tipler burada tanımlanır.
 *
 * RouteKind: Hangi tür seçim yapılacak?
 * - person: tek kişi (Örn: Hazırlayan, Onaylayan, Gerçekleştirme Görevlisi)
 * - person-list: birden fazla kişi (Örn: Araştırma Görevlileri, Komisyon Üyeleri, Muayene Komisyonu)
 * - unit: birim / makam (Örn: Sunulacak Makam, İhtiyaç Yeri)
 *
 * RouteSource: Varsayılan değer nereden okunacak?
 * - settings: sistem / şablon varsayılan ayarları
 * - document: aktif dosya verileri
 */
export type RouteKind = "person" | "person-list" | "unit";
export type RouteSource = "settings" | "document";

export interface RouteSlotDefinition {
  id: string;
  label: string;
  kind: RouteKind;
  defaultSource: RouteSource;
  required?: boolean;
  /** Şablon verisinde (CommonDocumentFields / formData) karşılık gelen birincil alan (örn: hazirlayanPersonelAdi, komisyonUyeleri, sunulacakMakamAdi) */
  fieldKey?: string;
  /** Tekil person seçiminde unvan alanı (örn: hazirlayanPersonelUnvan) */
  titleFieldKey?: string;
  /** Kullanıcıya gösterilecek kısa açıklama */
  description?: string;
}

export interface TemplateRouteDefinition {
  templateId: string;
  version: number;
  slots: readonly RouteSlotDefinition[];
}

export interface RouteAssignee {
  id: string;
  name: string;
  title?: string;
  unitId?: string;
  role?: string;
}

export type RouteValue = RouteAssignee | RouteAssignee[] | null;
export type RouteValues = Record<string, RouteValue>;

export interface RouteOverride {
  slotId: string;
  value: RouteValue;
}

export interface ResolvedRouteStep extends RouteSlotDefinition {
  value: RouteValue;
  origin: "settings" | "document" | "override" | "unassigned";
}

export interface ResolvedDocumentRoute {
  templateId: string;
  definitionVersion: number;
  steps: ResolvedRouteStep[];
  validationErrors?: string[];
}

