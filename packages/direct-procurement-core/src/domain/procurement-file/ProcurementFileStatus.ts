/**
 * ProcurementFileStatus
 *
 * Doğrudan temin dosyasının yaşam döngüsündeki
 * temel durumlarını tanımlar.
 *
 * Kullanım örneği:
 *
 * const status = ProcurementFileStatus.Draft;
 */
export enum ProcurementFileStatus {
    /**
     * Dosya taslak aşamasındadır.
     */
    Draft = "draft",

    /**
     * Dosya üzerinde işlemler devam etmektedir.
     */
    InProgress = "in_progress",

    /**
     * Dosyanın süreci tamamlanmıştır.
     */
    Completed = "completed",

    /**
     * Dosyanın süreci iptal edilmiştir.
     */
    Cancelled = "cancelled",
}
