"use client";

import { useCallback, useEffect, useState } from "react";
import type { RequirementDto } from "../../application/dto/requirement/RequirementDto";

export interface RequirementClientLike {
    getRequirementByFileId(fileId: number): Promise<{ success: boolean; data?: any; error?: any }>;
}

export interface UseRequirementResult {
    requirement: RequirementDto | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useRequirement(
    fileId: number,
    client: RequirementClientLike,
): UseRequirementResult {
    const [requirement, setRequirement] = useState<RequirementDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!fileId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.getRequirementByFileId(fileId);
            if (res.success && res.data) {
                setRequirement(res.data);
            } else {
                setError(res.error?.message ?? "İhtiyaç raporu bulunamadı.");
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

    return { requirement, isLoading, error, reload };
}
