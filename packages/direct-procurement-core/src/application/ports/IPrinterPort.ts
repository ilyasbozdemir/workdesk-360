/**
 * Yazıcı ve Baskı Arayüzü (Printer Port)
 *
 * İşletim sistemi veya Electron webContents üzerinden yazıcıları listeleme
 * ve yazdırma işlemlerini soyutlayan port arayüzüdür.
 */

export interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options?: Record<string, string>;
}

export interface PrintMargins {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

export interface PrintJobOptions {
    printerName?: string;
    silent?: boolean;
    printBackground?: boolean;
    copies?: number;
    pageSize?: "A4" | "A5" | "Letter" | "Legal";
    landscape?: boolean;
    pageRanges?: string;
    margins?: PrintMargins;
    color?: boolean;
    duplex?: "simplex" | "duplex" | "duplexShortEdge";
}

export interface PrintJobResult {
    success: boolean;
    jobId?: string;
    printerName?: string;
    copies?: number;
    error?: string;
}

export interface IPrinterPort {
    /**
     * Sistemde tanımlı tüm yazıcıları listeler.
     */
    listPrinters(): Promise<PrinterInfo[]>;

    /**
     * Varsayılan sistem yazıcısını getirir.
     */
    getDefaultPrinter(): Promise<PrinterInfo | null>;

    /**
     * Belirtilen HTML içeriğini seçilen yazıcıya veya varsayılan yazıcıya basar.
     */
    printHtml(html: string, options?: PrintJobOptions): Promise<PrintJobResult>;
}
