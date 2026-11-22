"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApprovalDto } from "../../application/dto/approval/ApprovalDto";

export interface ApprovalClientLike {
    getDocumentsForFile(fileId: number): Promise<{ success: boolean; data?: any; error?: any }>;
    signDocument?(dto: any): Promise<{ success: boolean; error?: any }>;
}

export interface UseApprovalResult {
    documents: ApprovalDto[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useApproval(
    fileId: number,
    client: ApprovalClientLike,
): UseApprovalResult {
    const [documents, setDocuments] = useState<ApprovalDto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!fileId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.getDocumentsForFile(fileId);
            if (res.success && Array.isArray(res.data)) {
                setDocuments(res.data);
            } else {
                setError(res.error?.message ?? "Onay belgeleri yüklenemedi.");
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

    return { documents, isLoading, error, reload };
}
