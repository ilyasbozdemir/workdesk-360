import type { DirectProcurementService } from "./DirectProcurementService";
import type { DirectProcurementFacade } from "../application/services/DirectProcurementFacade";
import type { EnterQuoteCommand } from "../application/usecases/EnterQuote";
import type { AcceptanceLine } from "../domain/file/AcceptanceRecord";
import type { PrintJobOptions } from "../application/ports/IPrinterPort";
import type { CreateProcurementFileDto } from "../application/dto/procurement-file/ProcurementFileDto";

/**
 * Electron Main IPC Arabirimi
 */
export interface IpcMainLike {
    handle(
        channel: string,
        listener: (event: unknown, ...args: any[]) => Promise<any> | any,
    ): void;
}

/**
 * Electron Renderer IPC Arabirimi
 */
export interface IpcRendererLike {
    invoke(channel: string, ...args: any[]): Promise<any>;
}

export const IPC_PROCUREMENT_CHANNELS = {
    GET_FILE: "procurement:get-file",
    ENTER_QUOTE: "procurement:enter-quote",
    SELECT_WINNER: "procurement:select-winner",
    APPROVE_RESULT: "procurement:approve-result",
    RECORD_ACCEPTANCE: "procurement:record-acceptance",
    APPROVE_ACCEPTANCE: "procurement:approve-acceptance",
    CALCULATE_DEDUCTIONS: "procurement:calculate-deductions",
    // Ek Yazıcı, Görünüm ve En Üst Servis Kanalları
    GET_PRINTERS: "procurement:get-printers",
    PRINT_DOCUMENT: "procurement:print-document",
    GET_FILE_LIST_ITEM: "procurement:get-file-list-item",
    GET_FILE_DETAIL_VIEW: "procurement:get-file-detail-view",
    CHECK_COMPLIANCE: "procurement:check-compliance",
    GENERATE_EKAP_FORM: "procurement:generate-ekap-form",
} as const;

/**
 * Electron Main Sürecinde IPC İşleyicilerini Kaydeder.
 * Renderer sürecinden gelen çağrıları `DirectProcurementService` üzerinden yürütür.
 */
export function registerProcurementIpcHandlers(
    ipcMain: IpcMainLike,
    service: DirectProcurementService,
): void {
    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.GET_FILE,
        async (_event, fileId: number) => {
            return service.getFile(fileId);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.ENTER_QUOTE,
        async (_event, command: EnterQuoteCommand) => {
            return service.enterQuote(command);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.SELECT_WINNER,
        async (_event, fileId: number, at?: string) => {
            return service.selectWinner(fileId, at);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.APPROVE_RESULT,
        async (_event, fileId: number, at?: string) => {
            return service.approveResult(fileId, at);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.RECORD_ACCEPTANCE,
        async (
            _event,
            params: { fileId: number; lines: AcceptanceLine[]; date?: string },
        ) => {
            return service.recordAcceptance(params);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.APPROVE_ACCEPTANCE,
        async (
            _event,
            params: { fileId: number; seqNo: number; at?: string },
        ) => {
            return service.approveAcceptance(params);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.CALCULATE_DEDUCTIONS,
        async (_event, fileId: number, date?: string) => {
            return service.calculateDeductions(fileId, date);
        },
    );
}

/**
 * DirectProcurementFacade için IPC İşleyicilerini Kaydeder.
 */
export function registerProcurementFacadeIpcHandlers(
    ipcMain: IpcMainLike,
    facade: DirectProcurementFacade,
): void {
    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.GET_FILE,
        async (_event, fileId: number) => {
            return facade.getFile(fileId);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.GET_FILE_LIST_ITEM,
        async (_event, fileId: number) => {
            return facade.getFileListItem(fileId);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.GET_FILE_DETAIL_VIEW,
        async (_event, fileId: number) => {
            return facade.getFileDetailView(fileId);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.GET_PRINTERS,
        async () => {
            return facade.listAvailablePrinters();
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.PRINT_DOCUMENT,
        async (_event, title: string, html: string, options?: PrintJobOptions) => {
            return facade.printDocument(title, html, options);
        },
    );

    ipcMain.handle(
        IPC_PROCUREMENT_CHANNELS.GENERATE_EKAP_FORM,
        async (_event, fileId: number, extra?: any) => {
            return facade.generateEkapForm(fileId, extra);
        },
    );
}

/**
 * Electron Renderer Süreci İçin IPC Servis İstemcisi Oluşturur.
 */
export function createProcurementIpcClient(ipcRenderer: IpcRendererLike) {
    return {
        async getFile(fileId: number) {
            return ipcRenderer.invoke(IPC_PROCUREMENT_CHANNELS.GET_FILE, fileId);
        },
        async enterQuote(command: EnterQuoteCommand) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.ENTER_QUOTE,
                command,
            );
        },
        async selectWinner(fileId: number, at?: string) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.SELECT_WINNER,
                fileId,
                at,
            );
        },
        async approveResult(fileId: number, at?: string) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.APPROVE_RESULT,
                fileId,
                at,
            );
        },
        async recordAcceptance(params: {
            fileId: number;
            lines: AcceptanceLine[];
            date?: string;
        }) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.RECORD_ACCEPTANCE,
                params,
            );
        },
        async approveAcceptance(params: {
            fileId: number;
            seqNo: number;
            at?: string;
        }) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.APPROVE_ACCEPTANCE,
                params,
            );
        },
        async calculateDeductions(fileId: number, date?: string) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.CALCULATE_DEDUCTIONS,
                fileId,
                date,
            );
        },
        async getPrinters() {
            return ipcRenderer.invoke(IPC_PROCUREMENT_CHANNELS.GET_PRINTERS);
        },
        async printDocument(title: string, html: string, options?: PrintJobOptions) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.PRINT_DOCUMENT,
                title,
                html,
                options,
            );
        },
        async getFileListItem(fileId: number) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.GET_FILE_LIST_ITEM,
                fileId,
            );
        },
        async getFileDetailView(fileId: number) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.GET_FILE_DETAIL_VIEW,
                fileId,
            );
        },
        async generateEkapForm(fileId: number, extra?: any) {
            return ipcRenderer.invoke(
                IPC_PROCUREMENT_CHANNELS.GENERATE_EKAP_FORM,
                fileId,
                extra,
            );
        },
    };
}
