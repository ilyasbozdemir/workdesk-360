import { useCallback, useEffect, useState } from "react";
import type { CommissionMemberDto } from "../../application/dto/commission/CommissionDto";

export interface CommissionClientLike {
    getMembersForFile(fileId: number): Promise<{ success: boolean; data?: any; error?: any }>;
    assignMember?(dto: any): Promise<{ success: boolean; data?: any; error?: any }>;
}

export interface UseCommissionResult {
    members: CommissionMemberDto[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useCommission(
    fileId: number,
    client: CommissionClientLike,
): UseCommissionResult {
    const [members, setMembers] = useState<CommissionMemberDto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!fileId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.getMembersForFile(fileId);
            if (res.success && Array.isArray(res.data)) {
                setMembers(res.data);
            } else {
                setError(res.error?.message ?? "Komisyon üyeleri yüklenemedi.");
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

    return { members, isLoading, error, reload };
}
