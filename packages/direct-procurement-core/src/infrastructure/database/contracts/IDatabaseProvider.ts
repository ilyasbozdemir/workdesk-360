/**
 * IDatabaseProvider
 *
 * Veritabanı sağlayıcı sözleşmesi.
 *
 * Veritabanı bağlantılarını ve havuzlarını yöneten arayüzdür.
 */

import type { IDatabaseConnection } from "./IDatabaseConnection";

export interface IDatabaseProvider {
    /**
     * Veritabanı bağlantısı sağlar veya açar.
     */
    getConnection(): Promise<IDatabaseConnection>;

    /**
     * Veritabanı sağlayıcısını kapatır.
     */
    close(): Promise<void>;
}
