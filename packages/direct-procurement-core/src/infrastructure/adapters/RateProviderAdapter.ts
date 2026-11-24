import type { SqlExecutor, RateProvider } from "../../application/ports";
import type { RateSnapshot } from "../../domain/profile/DeductionRule";
import { SqliteMevzuatRateProvider } from "../database/SqliteMevzuatRateProvider";

export class RateProviderAdapter implements RateProvider {
    private readonly provider: SqliteMevzuatRateProvider;

    constructor(db: SqlExecutor) {
        this.provider = new SqliteMevzuatRateProvider(db);
    }

    async ratesFor(isoDate: string): Promise<RateSnapshot> {
        return this.provider.ratesFor(isoDate);
    }
}
