/**
 * GENERIC DOKÜMAN ROTA SÖZLEŞMELERİ
 * Bu dosya hiçbir domain mantığı (TEMİN, İHALE vb.) veya framework içermez.
 * Tüm doküman şablonları için evrensel rota tiplerini tanımlar.
 */

export type RouteKind = "person" | "person-list" | "unit";
export type RouteSource = "settings" | "document";

/**
 * Belge rotasındaki imza / işlem türü.
 * Komisyon görevi (Başkan, Üye, Yedek Üye vb.) ile karıştırılmamalıdır; ayrı bir alandır.
 */
export type CommissionSignatureType = "Paraf" | "Koordinasyon" | "İmza";

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
  /** Bu slot verisinin yazılacağı ek/eş anlamlı hedef alan anahtarları (Örn: ["komisyon", "fiyatKomisyonu"]) */
  targetFieldKeys?: readonly string[];
  /** Tekil person seçiminde unvan için ek/eş anlamlı hedef alan anahtarları (Örn: ["baskanUnvan", "harcamaYetkilisiUnvan"]) */
  targetTitleFieldKeys?: readonly string[];
  /** Veri çıkarılırken (extract) kontrol edilecek alternatif kaynak alan anahtarları */
  sourceFieldKeys?: readonly string[];
  /** Tekil person seçiminde unvan için alternatif kaynak alan anahtarları */
  sourceTitleFieldKeys?: readonly string[];
}

export interface TemplateRouteDefinition {
  templateId: string;
  version: number;
  slots: readonly RouteSlotDefinition[];
  /** Görevlendirme belgesi mi? (Yedek üyelerin ve tüm imza türlerinin dahil edildiği resmi görevlendirme yazıları) */
  isAppointmentDocument?: boolean;
}

export interface RouteAssignee {
  id: string;
  name: string;
  /** Personelin kadro / meslek unvanı (Örn: İnşaat Mühendisi, Şube Müdürü) */
  title?: string;
  /** Bağlı olduğu birim ID */
  unitId?: string;
  /** Bağlı olduğu birim adı */
  unitName?: string;
  /** Komisyondaki görevi / sıfatı (Örn: Komisyon Başkanı, Başkan, Üye, Yedek Üye) */
  role?: string;
  /** Belge rotasındaki imza türü (Paraf | Koordinasyon | İmza) - komisyon görevinden ayrıdır */
  imzaTuru?: CommissionSignatureType;
  /** Asil (1 / true) veya Yedek (0 / false) üye durumu */
  asilMi?: number | boolean;
  /** Yedek üyenin bu belgede asil üye yerine aktif katılıp imzalayacağı durumu */
  aktifKatilim?: boolean;
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
  /** Görevlendirme belgesi mi? (Yedek üyelerin ve tüm imza türlerinin dahil edildiği resmi görevlendirme yazıları) */
  isAppointmentDocument?: boolean;
}
