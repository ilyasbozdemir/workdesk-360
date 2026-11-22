import type { DirectProcurementService } from "./DirectProcurementService";
import type { EnterQuoteCommand } from "../application/usecases/EnterQuote";
import type { AcceptanceLine } from "../domain/file/AcceptanceRecord";

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
    };
}
