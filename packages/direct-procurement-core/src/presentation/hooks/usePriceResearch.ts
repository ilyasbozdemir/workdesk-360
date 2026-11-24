"use client";

import { useCallback, useEffect, useState } from "react";
import type { PriceOfferDto } from "../../application/dto/price-research/PriceResearchDto";

export interface PriceResearchClientLike {
    getOffersByFileId(fileId: number): Promise<{ success: boolean; data?: any; error?: any }>;
    enterQuote?(dto: any): Promise<{ success: boolean; data?: any; error?: any }>;
}

export interface UsePriceResearchResult {
    offers: PriceOfferDto[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function usePriceResearch(
    fileId: number,
    client: PriceResearchClientLike,
): UsePriceResearchResult {
    const [offers, setOffers] = useState<PriceOfferDto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!fileId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await client.getOffersByFileId(fileId);
            if (res.success && res.data) {
                setOffers(Array.isArray(res.data) ? res.data : []);
            } else {
                setError(res.error?.message ?? "Fiyat araştırması teklifleri yüklenemedi.");
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

    return { offers, isLoading, error, reload };
}
