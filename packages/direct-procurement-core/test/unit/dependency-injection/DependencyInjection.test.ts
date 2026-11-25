import { describe, expect, it, vi } from "vitest";
import type { SqlExecutor } from "@worksuite-360/core";
import {
    createDirectProcurementContainer,
    DirectProcurementContainer,
    TOKENS,
} from "../../../src/dependency-injection/Container";
import { DirectProcurementService } from "../../../src/dependency-injection/DirectProcurementService";
import {
    createProcurementIpcClient,
    IPC_PROCUREMENT_CHANNELS,
    registerProcurementIpcHandlers,
} from "../../../src/dependency-injection/IpcProcurementBridge";

function createMockSqlExecutor(): SqlExecutor {
    return {
        query: vi.fn().mockResolvedValue([]),
        execute: vi.fn().mockResolvedValue({ changes: 1 }),
        transaction: vi.fn().mockResolvedValue([]),
    };
}

describe("Aşama 5 — Composition & Dependency Injection", () => {
    describe("DirectProcurementContainer (Bağımlılıkların Merkezi Kurulumu)", () => {
        it("temel container servisleri kaydeder ve çözümler", () => {
            const container = new DirectProcurementContainer();
            const token = Symbol("TestService");
            container.registerInstance(token, { name: "TestInstance" });

            expect(container.has(token)).toBe(true);
            expect(container.resolve<{ name: string }>(token)).toEqual({
                name: "TestInstance",
            });
        });

        it("createDirectProcurementContainer tüm bağımlılıkları bağlar", () => {
            const mockDb = createMockSqlExecutor();
            const container = createDirectProcurementContainer(mockDb);

            expect(container.has(TOKENS.SqlExecutor)).toBe(true);
            expect(container.has(TOKENS.EventBus)).toBe(true);
            expect(container.has(TOKENS.FileRepository)).toBe(true);
            expect(container.has(TOKENS.DirectProcurementService)).toBe(true);

            const service = container.service;
            expect(service).toBeInstanceOf(DirectProcurementService);

            const repo = container.repository;
            expect(repo).toBeDefined();

            const bus = container.eventBus;
            expect(bus).toBeDefined();
        });
    });

    describe("DirectProcurementService (Service & Repository Bağlantısı)", () => {
        it("getFile dosya bulunamadığında NotFoundError döner", async () => {
            const mockRepo = {
                findById: vi.fn().mockResolvedValue(null),
                save: vi.fn(),
            };
            const service = new DirectProcurementService({
                repo: mockRepo as any,
                enterQuote: {} as any,
                selectWinner: {} as any,
                approveResult: {} as any,
                recordAcceptance: {} as any,
                approveAcceptance: {} as any,
                calculateDeductions: {} as any,
            });

            const result = await service.getFile(999);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("NOT_FOUND");
            }
        });

        it("enterQuote use-case'ini yürütür ve success döner", async () => {
            const mockEnterQuote = {
                execute: vi.fn().mockResolvedValue(undefined),
            };
            const service = new DirectProcurementService({
                repo: {} as any,
                enterQuote: mockEnterQuote as any,
                selectWinner: {} as any,
                approveResult: {} as any,
                recordAcceptance: {} as any,
                approveAcceptance: {} as any,
                calculateDeductions: {} as any,
            });

            const result = await service.enterQuote({
                fileId: 1,
                itemId: 10,
                bidderId: 5,
                unitPriceTL: "150.00",
                at: "2026-11-22",
            });

            expect(result.success).toBe(true);
            expect(mockEnterQuote.execute).toHaveBeenCalledWith({
                fileId: 1,
                itemId: 10,
                bidderId: 5,
                unitPriceTL: "150.00",
                at: "2026-11-22",
            });
        });
    });

    describe("IpcProcurementBridge (IPC Üzerinden Servis Erişimi)", () => {
        it("registerProcurementIpcHandlers kanalları ipcMain'e kaydeder", () => {
            const handlers = new Map<string, Function>();
            const mockIpcMain = {
                handle: vi.fn((channel: string, fn: Function) => {
                    handlers.set(channel, fn);
                }),
            };

            const mockService = {
                getFile: vi.fn().mockResolvedValue({ success: true, data: { id: 1 } }),
                enterQuote: vi.fn().mockResolvedValue({ success: true }),
                selectWinner: vi.fn(),
                approveResult: vi.fn(),
                recordAcceptance: vi.fn(),
                approveAcceptance: vi.fn(),
                calculateDeductions: vi.fn(),
            };

            registerProcurementIpcHandlers(mockIpcMain, mockService as any);

            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                IPC_PROCUREMENT_CHANNELS.GET_FILE,
                expect.any(Function),
            );
            expect(mockIpcMain.handle).toHaveBeenCalledWith(
                IPC_PROCUREMENT_CHANNELS.ENTER_QUOTE,
                expect.any(Function),
            );

            // Handler yürütülmesi
            const getFileHandler = handlers.get(IPC_PROCUREMENT_CHANNELS.GET_FILE);
            expect(getFileHandler).toBeDefined();
            getFileHandler!({}, 1);
            expect(mockService.getFile).toHaveBeenCalledWith(1);
        });

        it("createProcurementIpcClient renderer tarafından IPC kanallarını invoke eder", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({ success: true, data: 123 });
            const client = createProcurementIpcClient({ invoke: mockInvoke });

            const res = await client.getFile(42);
            expect(mockInvoke).toHaveBeenCalledWith(
                IPC_PROCUREMENT_CHANNELS.GET_FILE,
                42,
            );
            expect(res).toEqual({ success: true, data: 123 });
        });
    });
});
