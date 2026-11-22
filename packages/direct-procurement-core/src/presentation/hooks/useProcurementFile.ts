import { useCallback, useEffect, useState } from "react";
import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";

export interface ProcurementFileClientLike {
    getFile(fileId: number): Promise<{ success: boolean; data?: any; error?: any }>;
    updateFile?(fileId: number, dto: any): Promise<{ success: boolean; data?: any; error?: any }>;
    completeFile?(fileId: number): Promise<{ success: boolean; error?: any }>;
}

export interface UseProcurementFileResult {
    file: ProcurementFileDto | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useProcurementFile(
    fileId: number,
    client: ProcurementFileClientLike,
): UseProcurementFileResult {
    const [file, setFile] = useState<ProcurementFileDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!fileId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.getFile(fileId);
            if (res.success && res.data) {
                setFile(res.data);
            } else {
                setError(res.error?.message ?? "Dosya yüklenemedi.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, [fileId, client]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { file, isLoading, error, reload };
}
