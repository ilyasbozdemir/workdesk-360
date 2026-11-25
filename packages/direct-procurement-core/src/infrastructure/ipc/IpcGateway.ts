import {
    IPC_PROCUREMENT_CHANNELS,
    registerProcurementIpcHandlers,
    createProcurementIpcClient,
    type IpcMainLike,
    type IpcRendererLike,
} from "../../dependency-injection/IpcProcurementBridge";
import type { DirectProcurementService } from "../../dependency-injection/DirectProcurementService";

export class IpcGateway {
    static readonly CHANNELS = IPC_PROCUREMENT_CHANNELS;

    /**
     * Electron main process içinde IPC dinleyicilerini bağlar.
     */
    static registerMainHandlers(
        ipcMain: IpcMainLike,
        service: DirectProcurementService,
    ): void {
        registerProcurementIpcHandlers(ipcMain, service);
    }

    /**
     * Electron renderer process içinde IPC istemcisini oluşturur.
     */
    static createClient(ipcRenderer: IpcRendererLike) {
        return createProcurementIpcClient(ipcRenderer);
    }
}
