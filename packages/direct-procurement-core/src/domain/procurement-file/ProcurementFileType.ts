/**
 * ProcurementFileType
 *
 * Doğrudan temin dosyasının alım türünü tanımlar.
 *
 * Mevcut DATA_TeminDosyasi.tur alanındaki değerlerle uyumludur.
 *
 * Kullanım örneği:
 *
 * const type = ProcurementFileType.Goods;
 *
 * if (type === ProcurementFileType.Service) {
 *     // Hizmet alımı işlemleri uygulanır.
 * }
 */
export enum ProcurementFileType {
    /** Mal alımı */
    Goods = "mal",

    /** Hizmet alımı */
    Service = "hizmet",

    /** Yapım işi */
    Construction = "yapim_isi",

    /** Danışmanlık hizmeti */
    Consultancy = "danismanlik",
}
