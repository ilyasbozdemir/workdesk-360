import type React from "react";

/**
 * Validasyon Hata Elemanı
 */
export interface ValidationErrorItem {
  path: string;
  message: string;
  code?: string;
}

/**
 * Validasyon Raporu Sözleşmesi
 */
export interface ValidationReport {
  isValid: boolean;
  errors: ValidationErrorItem[];
  warnings?: ValidationErrorItem[];
}

/**
 * Standart Ortak Belge Veri Modeli (CommonDocumentFields)
 * Bütün Temin 360 React belge şablonlarının kullandığı tip-güvenli ortak alanlar.
 * Veritabanı ham kolon adları React şablonlarına doğrudan taşınmaz; bu model aracılığıyla tüketilir.
 */
export interface CommonDocumentFields {
  /** Dosya birincil anahtarı (DATA_TeminDosyasi.id) */
  dosyaId?: number;
  /** Dosya / Temin Numarası (DATA_TeminDosyasi.temin_no) */
  dosyaNo?: string;
  /** Dosyanın konusu / Alım konusu (DATA_TeminDosyasi.konu) */
  dosyaKonusu?: string;
  /** Dosya açılış veya evrak tarihi (DATA_TeminDosyasi.dosya_acilis_tarihi) */
  dosyaTarihi?: string;
  /** Resmî EBYS / E-DETSİS evrak sayısı (DATA_TeminDosyasi.evrak_sayisi) */
  evrakSayisi?: string;

  /** Kurum resmî adı (TANIM_Kurum.kurum_adi) */
  kurumAdi?: string;
  /** Kurum üst metni / T.C. üst başlığı */
  kurumUst?: string;
  /** Kurum anteti ham JSON veya metin (TANIM_Kurum.kurum_anteti) */
  kurumAnteti?: string;
  /** Ayrıştırılmış resmî antet satırları */
  antetSatirlari?: string[];
  /** Sol logo yolu / base64 (TANIM_Kurum.logo_sol) */
  solLogo?: string | null;
  /** Sağ logo yolu / base64 (TANIM_Kurum.logo_sag) */
  sagLogo?: string | null;

  /** Onay/Talep sunulan makam (DATA_TeminDosyasi.sunulacak_makam veya TANIM_Birim.sunum_makami) */
  sunulacakMakamAdi?: string;
  /** İhtiyacın karşılanacağı birim / mahal (DATA_TeminDosyasi.ihtiyac_yeri) */
  ihtiyacYeri?: string;
  /** Harcama birimi adı */
  harcamaBirimi?: string;
  /** Bütçe yılı */
  butceYili?: number | string;

  /** Belgeyi hazırlayan personel adı soyadı */
  hazirlayanPersonelAdi?: string;
  /** Belgeyi hazırlayan personel unvanı */
  hazirlayanPersonelUnvan?: string;
  /** Belgeyi hazırlayan personel telefonu */
  hazirlayanTelefon?: string;
  /** Belgeyi hazırlayan personel e-posta adresi */
  hazirlayanEposta?: string;

  /** Belgeyi talep eden personel adı soyadı */
  talepEdenPersonelAdi?: string;
  /** Belgeyi talep eden personel unvanı */
  talepEdenPersonelUnvan?: string;
  /** Belgeyi talep eden personel telefonu */
  talepEdenTelefon?: string;

  /** Belgeyi onaylayan / Harcama Yetkilisi adı soyadı */
  onaylayanPersonelAdi?: string;
  /** Belgeyi onaylayan / Harcama Yetkilisi unvanı */
  onaylayanPersonelUnvan?: string;
  /** Onay tarihi */
  onayTarihi?: string;
  /** Onaya sunulan tarih */
  onayaSunulanTarih?: string;
}

/**
 * Belge Başlık / Antet Çözümleme Bağlamı (Domain-Bağımsız)
 */
export interface DocumentHeaderContext {
  dosyaId?: number;
  documentId?: string | number;
  templateKey?: string;
  queryExecutor?: (sql: string, params: any[]) => Promise<any[]>;
  [key: string]: unknown;
}

/**
 * Genel Belge Üst Veri / Antet Sağlayıcı Sözleşmesi (Domain-Bağımsız)
 */
export interface DocumentHeaderProvider<THeader = unknown> {
  resolve(
    contextOrDosyaId: DocumentHeaderContext | number,
    queryExecutor?: (sql: string, params: any[]) => Promise<any[]>,
  ): Promise<THeader>;
  clearCache?(): void;
}

/**
 * Ortak Kurumsal ve Antet Bilgileri Sözleşmesi
 * Sadece kurum, birim ve dosya üst bilgilerini taşır; belgeye özel kalem veya teklif içermez.
 */
export interface InstitutionalHeaderData {
  antetSatirlari: string[];
  kurumUst: string;
  kurumAdi: string;
  mudurluk: string;
  solLogo: string | null;
  sagLogo: string | null;
  dosyaNo?: string;
  evrakSayisi?: string;
  butceYili?: number;
  dosyaTarihi?: string;
  konu?: string;
  harcamaYetkilisiAdi?: string;
  harcamaYetkilisiUnvan?: string;
  birimId?: number;
  sunulacakMakam?: string;
  [key: string]: unknown;
}

/**
 * Belge Çözümleme Bağlamı (Resolution Context)
 */
export interface DocumentResolutionContext {
  dosyaId: number;
  templateKey: string;
  headerData: InstitutionalHeaderData;
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>;
  invitedFirms?: unknown[];
  [key: string]: unknown;
}

/**
 * Belgeye Özel Veri Çözücü Sözleşmesi (Document Resolver Interface)
 */
export interface DocumentDataResolver<TData = Record<string, unknown>> {
  resolve(context: DocumentResolutionContext): Promise<TData>;
}

/**
 * Belge Çizim Bileşeni Özellikleri (Document Renderer Props)
 */
export interface DocumentRendererComponentProps<
  TData = Record<string, unknown>,
> {
  data: TData;
  orientation?: "portrait" | "landscape";
  chrome?: "paper" | "bare";
  scale?: number;
  isEditing?: boolean;
  onFieldChange?: (key: string, val: unknown) => void;
  personelListesi?: unknown[];
  firmaListesi?: unknown[];
  birimListesi?: unknown[];
  firstPageLimit?: number;
  className?: string;
  style?: React.CSSProperties;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Belge Tanım Sözleşmesi (Document Definition in Template Registry)
 */
export interface DocumentDefinition<TData = Record<string, unknown>> {
  templateKey: string;
  name: string;
  title: string;
  category: string;
  categoryLabel: string;
  description?: string;
  orientation: "portrait" | "landscape";
  resolver?: DocumentDataResolver<TData>;
  renderer: React.ComponentType<DocumentRendererComponentProps<TData>>;
  validate?: (data: TData) => ValidationReport;
  requiredProviders?: Array<
    "institutionalHeader" | "items" | "firms" | "commissions"
  >;
  meta?: Record<string, unknown>;
}

/**
 * Disk / Veritabanı Belge Kaydı Sözleşmesi
 */
export interface DocumentRecord<T = Record<string, unknown>> {
  id?: number;
  dosyaId: number;
  templateKey: string;
  data: T;
  sablonVersiyon: number;
  createdAt?: string;
  updatedAt?: string;
  isExisting: boolean;
  headerData?: InstitutionalHeaderData;
  personelListesi?: unknown[];
  firmaListesi?: unknown[];
  birimListesi?: unknown[];
  dosyaRecord?: unknown;
  validationReport?: ValidationReport;
}

/**
 * Bağımsız Depolama Adaptörü (Storage Bridge)
 * Masaüstü IPC, HTTP API veya InMemory mock ile çalışabilir.
 */
export interface DocumentStorageRecord {
  id?: number;
  data: Record<string, unknown>;
  sablonVersiyon?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentStorageAdapter {
  getDocument(params: {
    dosyaId: number;
    templateKey: string;
  }): Promise<
    {
      success: boolean;
      exists?: boolean;
      record?: DocumentStorageRecord;
      error?: string;
    }
  >;

  saveDocument(params: {
    dosyaId: number;
    templateKey: string;
    data: Record<string, unknown>;
    sablonVersiyon?: number;
  }): Promise<
    { success: boolean; id?: number; updatedAt?: string; error?: string }
  >;

  resetDocument(params: {
    dosyaId: number;
    templateKey: string;
  }): Promise<{ success: boolean; error?: string }>;

  deleteDocument(params: {
    dosyaId: number;
    templateKey: string;
  }): Promise<{ success: boolean; error?: string }>;

  executeQuery?(sql: string, params: any[]): Promise<any[]>;
}

export interface DocumentResolveContext {
  invitedFirms?: unknown[];
  [key: string]: unknown;
}

export interface LoadOrCreateDocumentParams {
  dosyaId: number;
  templateKey: string;
  context?: DocumentResolveContext;
  forceDefault?: boolean;
  persistIfMissing?: boolean;
}

export interface PrepareDocumentParams {
  templateId: string;
  documentId: number | string;
  context?: DocumentResolveContext;
  forceDefault?: boolean;
  persistIfMissing?: boolean;
}

export interface SaveDocumentParams<T = Record<string, unknown>> {
  dosyaId: number;
  templateKey: string;
  data: T;
  sablonVersiyon?: number;
  validateBeforeSave?: boolean;
}

export interface ResetDocumentParams {
  dosyaId: number;
  templateKey: string;
  context?: DocumentResolveContext;
}

export interface DeleteDocumentParams {
  dosyaId: number;
  templateKey: string;
}

export interface SyncDocumentParams<T = Record<string, unknown>> {
  dosyaId: number;
  templateKey: string;
  existingData: T;
  context?: DocumentResolveContext;
}

export interface CompileHtmlParams {
  templateKey: string;
  data: Record<string, unknown>;
  orientation?: "portrait" | "landscape";
  personelListesi?: unknown[];
  firmaListesi?: unknown[];
  birimListesi?: unknown[];
  firstPageLimit?: number;
  activeTemplateConf?: { name?: string };
}

export interface ExportPdfParams {
  dosyaId: number;
  templateKey: string;
  data: Record<string, unknown>;
  orientation?: "portrait" | "landscape";
  dosyaRecord?: unknown;
  personelListesi?: unknown[];
  firmaListesi?: unknown[];
  firstPageLimit?: number;
}
