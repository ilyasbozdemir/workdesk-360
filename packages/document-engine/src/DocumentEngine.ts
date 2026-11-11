import React from "react";
import { renderToString } from "react-dom/server";
import { InvalidTemplateKeyError, TemplateRegistry } from "./TemplateRegistry";
import {
  CompileHtmlParams,
  DeleteDocumentParams,
  DocumentDefinition,
  DocumentHeaderContext,
  DocumentHeaderProvider,
  DocumentRecord,
  DocumentStorageAdapter,
  InstitutionalHeaderData,
  LoadOrCreateDocumentParams,
  PrepareDocumentParams,
  ResetDocumentParams,
  SaveDocumentParams,
  SyncDocumentParams,
  ValidationReport,
} from "./types/contracts";
import { smartMergeDocumentData } from "./mergers/smartMerge";

export type HeaderResolverFn<THeader = InstitutionalHeaderData> = (
  contextOrDosyaId: DocumentHeaderContext | number,
  queryExecutor?: (sql: string, params: any[]) => Promise<any[]>,
) => Promise<THeader>;

export type DocumentValidatorFn = (
  templateKey: string,
  data: Record<string, unknown>,
) => ValidationReport;

export type DocumentSavedListener = (record: {
  dosyaId: number;
  templateKey: string;
  data: Record<string, unknown>;
}) => void;

/**
 * Bağımsız Belge Yönetim ve Çıktı Motoru (DocumentEngine)
 * - Verilen templateKey üzerinden TemplateRegistry'deki doğru belge tanımını bulur.
 * - Belgenin resolver ve renderer'ını koordine eder.
 * - Sektör bağımsız orkestrasyon motorudur; depolama adaptörü, header sağlayıcı ve çözümleyiciler dışarıdan enjekte edilir.
 * - Başlık sağlayıcı ve depolama adaptörü enjeksiyon (setHeaderResolver, setQueryExecutor) ile dışarıdan verilir.
 * - UI bağımlılığı yoktur; FlowDesk veya diğer modüller tarafından doğrudan tüketilebilir.
 */
export class DocumentEngine {
  private static storageAdapter: DocumentStorageAdapter | null = null;
  private static customQueryExecutor:
    | ((sql: string, params: any[]) => Promise<any[]>)
    | null = null;
  private static headerProvider: DocumentHeaderProvider<any> | null = null;
  private static headerResolver: HeaderResolverFn<any> | null = null;
  private static validator: DocumentValidatorFn | null = null;
  private static savedListeners: Set<DocumentSavedListener> = new Set();

  /**
   * Depolama adaptörünü tanımlar (Masaüstü IPC veya Mock)
   */
  static setStorageAdapter(adapter: DocumentStorageAdapter | null): void {
    this.storageAdapter = adapter;
  }

  static getStorageAdapter(): DocumentStorageAdapter | null {
    return this.storageAdapter;
  }

  /**
   * Doğrulama motorunu enjekte eder (IoC)
   */
  static setValidator(validator: DocumentValidatorFn | null): void {
    this.validator = validator;
  }

  /**
   * Belgeyi doğrular (Önce şablonun kendi validate metoduna, yoksa enjekte edilmiş validatöre bakar)
   */
  static validate(
    templateKey: string,
    data: Record<string, unknown>,
  ): ValidationReport {
    if (TemplateRegistry.has(templateKey)) {
      const def = TemplateRegistry.get(templateKey);
      if (def?.validate) {
        return def.validate(data);
      }
    }
    if (this.validator) {
      return this.validator(templateKey, data);
    }
    return { isValid: true, errors: [] };
  }

  private static getEffectiveStorageAdapter(): DocumentStorageAdapter | null {
    return this.storageAdapter;
  }

  /**
   * Veritabanı sorgu yürütücüsünü tanımlar
   */
  static setQueryExecutor(
    executor: (sql: string, params: any[]) => Promise<any[]>,
  ): void {
    this.customQueryExecutor = executor;
  }

  /**
   * Kurumsal başlık / antet çözümleyicisini tanımlar
   */
  static setHeaderResolver<THeader = InstitutionalHeaderData>(
    resolver: HeaderResolverFn<THeader>,
  ): void {
    this.headerResolver = resolver;
  }

  /**
   * Genel belge başlık sağlayıcı nesnesini tanımlar (IoC)
   */
  static setHeaderProvider<THeader = InstitutionalHeaderData>(
    provider: DocumentHeaderProvider<THeader>,
  ): void {
    this.headerProvider = provider;
    this.headerResolver = (ctxOrId, qe) => provider.resolve(ctxOrId, qe);
  }

  /**
   * Belge kaydedildiğinde bildirim dinleyicisi ekler
   */
  static onDocumentSaved(listener: DocumentSavedListener): () => void {
    this.savedListeners.add(listener);
    return () => {
      this.savedListeners.delete(listener);
    };
  }

  /**
   * Aktif sorgu yürütücüsünü döner
   */
  static queryExecutor = async (sql: string, params: any[]): Promise<any[]> => {
    if (DocumentEngine.customQueryExecutor) {
      return DocumentEngine.customQueryExecutor(sql, params);
    }
    if (DocumentEngine.storageAdapter?.executeQuery) {
      return DocumentEngine.storageAdapter.executeQuery(sql, params);
    }
    throw new Error(
      "[DocumentEngine] queryExecutor yapılandırılmamış. Lütfen 'DocumentEngine.setQueryExecutor()' veya 'DocumentEngine.setStorageAdapter()' ile bir sorgu yürütücü sağlayınız."
    );
  };

  /**
   * Şablon anahtarını kanonik biçime dönüştürür ve varlığını doğrular
   */
  static resolveKey(templateKey: string): string {
    if (!templateKey || typeof templateKey !== "string") {
      throw new InvalidTemplateKeyError(String(templateKey));
    }
    const cleanKey = TemplateRegistry.normalizeKey(templateKey);

    if (!TemplateRegistry.has(cleanKey)) {
      throw new InvalidTemplateKeyError(templateKey);
    }

    return TemplateRegistry.get(cleanKey).templateKey;
  }

  /**
   * Belgeye ait kurumsal üst veriyi çözer
   */
  private static async resolveHeaderData(
    contextOrDosyaId: DocumentHeaderContext | number,
  ): Promise<InstitutionalHeaderData> {
    if (this.headerProvider) {
      const ctx: DocumentHeaderContext =
        typeof contextOrDosyaId === "number"
          ? { dosyaId: contextOrDosyaId, queryExecutor: this.queryExecutor }
          : { queryExecutor: this.queryExecutor, ...contextOrDosyaId };
      return (await this.headerProvider.resolve(
        ctx,
        this.queryExecutor,
      )) as InstitutionalHeaderData;
    }
    if (this.headerResolver) {
      return this.headerResolver(contextOrDosyaId, this.queryExecutor);
    }
    throw new Error(
      `[DocumentEngine] headerResolver yapılandırılmamış. Lütfen 'configureTeminEngine()' veya 'DocumentEngine.setHeaderProvider()' çağrınız.`,
    );
  }

  /**
   * Belgeye ait verileri TemplateRegistry ve ilişkili özel resolver ile çözümler.
   */
  /**
   * @purpose Şablonun resolver'ı üzerinden taze veri çözümlemesi yapar ve antet ile birleştirir.
   * @source TemplateRegistry, DefaultDocumentResolver, headerResolver (IoC)
   * @scope dosyaId, templateKey
   * @usedBy DocumentEngine.loadOrCreateDocument, DocumentEngine.compileHtml
   * @see packages/document-templates/src/engine/resolvers/DefaultDocumentResolver.ts
   *
   * Veri çözümleme Document Engine tarafından yürütülür.
   * Bu fonksiyon ikinci bir SQL çözümleme zinciri oluşturmamalıdır.
   */
  static async resolveDocumentData<T = Record<string, unknown>>(params: {
    dosyaId: number;
    templateKey: string;
    invitedFirms?: unknown[];
  }): Promise<
    {
      data: T;
      headerData: InstitutionalHeaderData;
      definition: DocumentDefinition<T>;
    }
  > {
    const { dosyaId, templateKey, invitedFirms } = params;
    const canonicalKey = this.resolveKey(templateKey);

    const definition = TemplateRegistry.get<T>(canonicalKey);
    const headerData = await this.resolveHeaderData(dosyaId);

    if (!definition.resolver) {
      throw new Error(
        `Şablon için veri çözümleyicisi (resolver) tanımlanmamış: "${canonicalKey}"`,
      );
    }

    const resolvedData = await definition.resolver.resolve({
      dosyaId,
      templateKey: canonicalKey,
      headerData,
      queryExecutor: this.queryExecutor,
      invitedFirms,
    });

    return {
      data: resolvedData,
      headerData,
      definition,
    };
  }

  /**
   * @purpose Tekil ve standart belge hazırlama giriş noktası (Unified Document Preparation Flow).
   * @source DATA_TeminBelgeSnapshot, headerResolver (IoC), DefaultDocumentResolver
   * @scope dosyaId, templateId
   * @usedBy Desktop DocumentPreviewModalV3, PDF Derleyici, Dışa Aktarım Servisleri
   * @see packages/document-engine/src/DocumentEngine.ts:loadOrCreateDocument
   *
   * Veri çözümleme Document Engine tarafından yürütülür.
   * Bu fonksiyon ikinci bir SQL çözümleme zinciri oluşturmamalıdır.
   */
  static async prepare<T = Record<string, unknown>>(
    params: PrepareDocumentParams,
  ): Promise<DocumentRecord<T>> {
    const {
      templateId,
      documentId,
      context,
      forceDefault = false,
      persistIfMissing = false,
    } = params;
    const dosyaId = typeof documentId === "number"
      ? documentId
      : Number(documentId) || 0;
    return await this.loadOrCreateDocument<T>({
      dosyaId,
      templateKey: templateId,
      context,
      forceDefault,
      persistIfMissing,
    });
  }

  /**
   * @purpose Belgeyi disk/veritabanı snapshot'ından yükler, yoksa ilk kez çözümler ve akıllı birleştirme uygular.
   * @source DATA_TeminBelgeSnapshot, DATA_TeminKalem, DATA_TeminDosyasi, TANIM_Kurum
   * @scope dosyaId, templateKey
   * @usedBy DocumentPreviewModalV3, DocumentEngine.prepare
   * @see packages/document-engine/src/mergers/smartMerge.ts
   *
   * Veri çözümleme Document Engine tarafından yürütülür.
   * Kullanıcının manuel düzenlemelerini korur (smartMerge), eksik kalemleri otomatik tamamlar.
   */
  static async loadOrCreateDocument<T = Record<string, unknown>>(
    params: LoadOrCreateDocumentParams,
  ): Promise<DocumentRecord<T>> {
    const {
      dosyaId,
      templateKey,
      context,
      forceDefault = false,
      persistIfMissing = false,
    } = params;
    const canonicalKey = this.resolveKey(templateKey);
    const headerData = await this.resolveHeaderData(dosyaId);
    const adapter = this.getEffectiveStorageAdapter();

    // 1. Mevcut kayıtlı snapshot kontrolü
    if (adapter && !forceDefault) {
      const storageRes = await adapter.getDocument({
        dosyaId,
        templateKey: canonicalKey,
      });

      if (!storageRes?.success) {
        throw new Error(
          storageRes?.error || "Belge veritabanından yüklenirken hata oluştu",
        );
      }

      if (storageRes.exists && storageRes.record) {
        const existingData = (storageRes.record.data || {}) as Record<
          string,
          unknown
        >;
        const hasKalemler = (Array.isArray(existingData.ihtiyacKalemleri) &&
          existingData.ihtiyacKalemleri.length > 0) ||
          (Array.isArray(existingData.kalemler) &&
            existingData.kalemler.length > 0) ||
          (Array.isArray(existingData.malzemeler) &&
            existingData.malzemeler.length > 0) ||
          (Array.isArray(existingData.items) && existingData.items.length > 0);

        let finalData = storageRes.record.data as T;

        // Kaydedilmiş snapshot'ta kalemler boşsa fakat veritabanında taze kalemler varsa, akıllıca harmanla
        if (!hasKalemler) {
          try {
            const { data: freshSourceData } = await this.resolveDocumentData<T>(
              {
                dosyaId,
                templateKey: canonicalKey,
                invitedFirms: context?.invitedFirms as unknown[],
              },
            );
            finalData = smartMergeDocumentData(
              existingData,
              freshSourceData as Record<string, unknown>,
            ) as T;
          } catch {
            // Taze veri çözülemezse mevcut snapshot verisi korunur
          }
        }

        return {
          id: storageRes.record.id,
          dosyaId,
          templateKey: canonicalKey,
          data: finalData,
          sablonVersiyon: storageRes.record.sablonVersiyon || 1,
          createdAt: storageRes.record.createdAt,
          updatedAt: storageRes.record.updatedAt,
          isExisting: true,
          headerData,
        };
      }
    }

    // 2. Kayıt yoksa resolver çalıştırılarak taze veri üretilir
    const { data: initialData } = await this.resolveDocumentData<T>({
      dosyaId,
      templateKey: canonicalKey,
      invitedFirms: context?.invitedFirms as unknown[],
    });

    // 3. Yalnızca persistIfMissing === true istendiğinde ilk snapshot'ı otomatik kaydet
    if (adapter && !forceDefault && persistIfMissing) {
      try {
        const saveRes = await adapter.saveDocument({
          dosyaId,
          templateKey: canonicalKey,
          data: initialData as Record<string, unknown>,
          sablonVersiyon: 1,
        });

        return {
          id: saveRes.id,
          dosyaId,
          templateKey: canonicalKey,
          data: initialData,
          sablonVersiyon: 1,
          createdAt: saveRes.updatedAt,
          updatedAt: saveRes.updatedAt,
          isExisting: false,
          headerData,
        };
      } catch (saveErr) {
        console.warn(
          "[DocumentEngine] İlk snapshot otomatik kaydetme hatası:",
          saveErr,
        );
      }
    }

    return {
      dosyaId,
      templateKey: canonicalKey,
      data: initialData,
      sablonVersiyon: 1,
      isExisting: false,
      headerData,
    };
  }

  /**
   * Belgeyi depolar ve dinleyicilere haber verir.
   */
  static async saveDocument<T = Record<string, unknown>>(
    params: SaveDocumentParams<T>,
  ): Promise<{ success: boolean; id?: number; updatedAt?: string }> {
    const {
      dosyaId,
      templateKey,
      data,
      sablonVersiyon = 1,
      validateBeforeSave = true,
    } = params;
    const canonicalKey = this.resolveKey(templateKey);

    // Şema ve doğrulama denetimi
    if (validateBeforeSave) {
      const report = this.validate(
        canonicalKey,
        data as Record<string, unknown>,
      );
      if (!report.isValid && report.errors.length > 0) {
        const errorMsgs = report.errors.map((e) => e.message).join(", ");
        throw new Error(
          `Belge doğrulama hataları nedeniyle kaydedilemedi: ${errorMsgs}`,
        );
      }
    }

    const adapter = this.getEffectiveStorageAdapter();
    if (!adapter) {
      throw new Error("Depolama adaptörü tanımlanmamış, belge kaydedilemedi.");
    }

    const res = await adapter.saveDocument({
      dosyaId,
      templateKey: canonicalKey,
      data: data as Record<string, unknown>,
      sablonVersiyon,
    });

    if (!res?.success) {
      throw new Error(res?.error || "Belge kaydedilirken hata oluştu.");
    }

    // Dinleyicileri bilgilendir
    for (const listener of this.savedListeners) {
      try {
        listener({
          dosyaId,
          templateKey: canonicalKey,
          data: data as Record<string, unknown>,
        });
      } catch (err) {
        console.warn("[DocumentEngine] onDocumentSaved listener error:", err);
      }
    }

    return {
      success: true,
      id: res.id,
      updatedAt: res.updatedAt,
    };
  }

  /**
   * Kullanıcı açıkça talep ettiğinde belgeyi varsayılan durumuna sıfırlar.
   */
  static async resetToDefault<T = Record<string, unknown>>(
    params: ResetDocumentParams,
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, context } = params;
    const canonicalKey = this.resolveKey(templateKey);
    const adapter = this.getEffectiveStorageAdapter();
    if (!adapter) {
      throw new Error(
        "Depolama adaptörü tanımlanmamış, belge sıfırlanamadı.",
      );
    }

    const res = await adapter.resetDocument({
      dosyaId,
      templateKey: canonicalKey,
    });
    if (!res?.success) {
      throw new Error(res?.error || "Belge sıfırlanırken hata oluştu.");
    }

    return await this.loadOrCreateDocument<T>({
      dosyaId,
      templateKey: canonicalKey,
      context,
      forceDefault: true,
    });
  }

  /**
   * Güncel Verileri Al (Sync / Rebase)
   * - Resolver'dan taze veriyi çeker.
   * - Kaydedilmiş mevcut snapshot ile akıllıca birleştirir (kullanıcı notları korunur, yeni kalemler eklenir).
   */
  static async syncWithSource<T = Record<string, unknown>>(
    params: SyncDocumentParams<T>,
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, existingData, context } = params;
    const canonicalKey = this.resolveKey(templateKey);

    // Resolver'dan en taze kaynak veriyi çek
    const { data: freshData, headerData } = await this.resolveDocumentData<T>({
      dosyaId,
      templateKey: canonicalKey,
      invitedFirms: context?.invitedFirms as unknown[],
    });

    // Akıllı birleştirici ile snapshot + kaynak veriyi harmanla
    const mergedData = smartMergeDocumentData(
      existingData as Record<string, unknown>,
      freshData as Record<string, unknown>,
    ) as T;

    const valReport = this.validate(
      canonicalKey,
      mergedData as Record<string, unknown>,
    );

    return {
      dosyaId,
      templateKey: canonicalKey,
      data: mergedData,
      sablonVersiyon: 1,
      isExisting: true,
      headerData,
      validationReport: valReport,
    };
  }

  /**
   * Belirli bir dosyanın belirli belge kaydını siler.
   */
  static async deleteDocument(params: DeleteDocumentParams): Promise<boolean> {
    const { dosyaId, templateKey } = params;
    const canonicalKey = this.resolveKey(templateKey);
    const adapter = this.getEffectiveStorageAdapter();
    if (!adapter) {
      throw new Error(
        "Depolama adaptörü tanımlanmamış, belge silinemedi.",
      );
    }

    const res = await adapter.deleteDocument({
      dosyaId,
      templateKey: canonicalKey,
    });
    if (!res?.success) {
      throw new Error(res?.error || "Belge silinirken hata oluştu.");
    }
    return Boolean(res?.success);
  }

  /**
   * Önizleme ve PDF çıktısı için ortak saf HTML derleyicisi.
   */
  static compileHtml(params: CompileHtmlParams): string {
    const {
      templateKey,
      data,
      orientation = "portrait",
      personelListesi = [],
      firmaListesi = [],
      birimListesi = [],
      firstPageLimit,
    } = params;

    const canonicalKey = this.resolveKey(templateKey);
    const definition = TemplateRegistry.get(canonicalKey);
    const SpecificRenderer = definition.renderer;

    const renderedBody = renderToString(
      React.createElement(SpecificRenderer, {
        data,
        orientation,
        chrome: "bare",
        scale: 1,
        isEditing: false,
        personelListesi,
        firmaListesi,
        birimListesi,
        firstPageLimit,
      }),
    );

    const isLandscape = orientation === "landscape";
    const pageSize = isLandscape ? "297mm 210mm" : "210mm 297mm";

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${definition.title || canonicalKey}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  ${renderedBody}
</body>
</html>`;
  }
}
