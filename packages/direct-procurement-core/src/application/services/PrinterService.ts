import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import type {
    IPrinterPort,
    PrinterInfo,
    PrintJobOptions,
    PrintJobResult,
} from "../ports/IPrinterPort";

/**
 * PrinterService
 *
 * Veritabanı harici (DB-agnostic) yazıcı ve baskı yönetim servisidir.
 * Sistemdeki yazıcıları listeleme, varsayılan yazıcıyı seçme, sayfa aralığı/kopya
 * seçenekleriyle doğrudan veya sessiz yazdırma işlevlerini yürütür.
 */
export class PrinterService {
    constructor(private readonly printerPort: IPrinterPort) {}

    /**
     * İşletim sisteminde veya ağda bulunan tüm yazıcıları listeler.
     */
    async listPrinters(): Promise<Result<PrinterInfo[], AppError>> {
        try {
            const printers = await this.printerPort.listPrinters();
            return success(printers);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PRINTER_LIST_ERROR",
                    message: `Yazıcılar listelenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}`,
                }),
            );
        }
    }

    /**
     * Varsayılan yazıcıyı getirir.
     */
    async getDefaultPrinter(): Promise<Result<PrinterInfo | null, AppError>> {
        try {
            const printer = await this.printerPort.getDefaultPrinter();
            return success(printer);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PRINTER_DEFAULT_ERROR",
                    message: `Varsayılan yazıcı getirilemedi: ${error instanceof Error ? error.message : String(error)}`,
                }),
            );
        }
    }

    /**
     * Ham HTML içeriğini belirtilen yazıcı veya varsayılan yazıcıya gönderir.
     */
    async printHtml(
        html: string,
        options?: PrintJobOptions,
    ): Promise<Result<PrintJobResult, AppError>> {
        try {
            const result = await this.printerPort.printHtml(html, options);
            if (!result.success) {
                return failure(
                    new AppError({
                        code: "PRINT_EXECUTION_FAILED",
                        message: result.error || "Yazdırma işlemi işletim sistemi tarafından reddedildi.",
                    }),
                );
            }
            return success(result);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PRINT_ERROR",
                    message: `Baskı gönderiminde hata: ${error instanceof Error ? error.message : String(error)}`,
                }),
            );
        }
    }

    /**
     * Başlıklı resmî bir doğrudan temin belgesini yazdırır.
     */
    async printDocument(
        documentTitle: string,
        htmlContent: string,
        options?: PrintJobOptions,
    ): Promise<Result<PrintJobResult, AppError>> {
        if (!htmlContent || !htmlContent.trim()) {
            return failure(
                new AppError({
                    code: "PRINT_EMPTY_CONTENT",
                    message: `'${documentTitle}' başlıklı belge için yazdırılacak içerik bulunamadı.`,
                }),
            );
        }

        return this.printHtml(htmlContent, options);
    }
}
