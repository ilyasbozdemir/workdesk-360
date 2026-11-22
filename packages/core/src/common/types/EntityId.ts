/**
 * Entity kimlikleri için ortak tip tanımları.
 *
 * WorkDesk 360 içerisindeki farklı modüllerin
 * entity kimliklerini birbirinden ayırt etmeyi sağlar.
 */

/**
 * Genel entity kimliği.
 */
export type EntityId = string;

/**
 * Belirli bir entity türüne ait kimlik.
 *
 * Örnek:
 * type TeminDosyasiId = EntityIdOf<"TeminDosyasi">;
 * type PersonelId = EntityIdOf<"Personel">;
 */
export type EntityIdOf<T extends string> = string & {
    readonly __entityId: T;
};

/**
 * Entity ID oluşturmak için yardımcı fonksiyon.
 *
 * Verilen string değeri ilgili entity türüne ait
 * type-safe kimliğe dönüştürür.
 */
export function createEntityId<T extends string>(
    value: string,
): EntityIdOf<T> {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
        throw new Error("Entity ID boş olamaz.");
    }

    return normalizedValue as EntityIdOf<T>;
}

/**
 * Entity ID değerinin geçerli olup olmadığını kontrol eder.
 */
export function isValidEntityId(value: unknown): value is EntityId {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * Entity ID değerini string olarak döndürür.
 */
export function entityIdToString<T extends string>(
    id: EntityIdOf<T>,
): string {
    return id;
}

/*
Kullanım örneği
type TeminDosyasiId = EntityIdOf<"TeminDosyasi">;
type PersonelId = EntityIdOf<"Personel">;

const dosyaId = createEntityId<"TeminDosyasi">("dosya-123");
const personelId = createEntityId<"Personel">("personel-456");

// Geçerli kullanım
const id: TeminDosyasiId = dosyaId;

// TypeScript hata verir:
// const wrong: TeminDosyasiId = personelId;


*/
