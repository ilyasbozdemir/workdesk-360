import { describe, expect, it } from "vitest";
import {
    createEntityId,
    entityIdToString,
    isValidEntityId,
} from "../../src/common/types/EntityId";

describe("EntityId", () => {
    describe("createEntityId()", () => {
        it("geçerli string değeri kırparak tip korumalı EntityId döndürür", () => {
            const id = createEntityId<"Dosya">("  dosya-123  ");
            expect(id).toBe("dosya-123");
        });

        it("boş veya salt boşluktan oluşan değerde hata fırlatır", () => {
            expect(() => createEntityId("")).toThrow("Entity ID boş olamaz.");
            expect(() => createEntityId("   ")).toThrow("Entity ID boş olamaz.");
        });
    });

    describe("isValidEntityId()", () => {
        it("boş olmayan stringler için true döndürür", () => {
            expect(isValidEntityId("abc")).toBe(true);
            expect(isValidEntityId("123")).toBe(true);
            expect(isValidEntityId("  x  ")).toBe(true);
        });

        it("geçersiz değerler için false döndürür", () => {
            expect(isValidEntityId("")).toBe(false);
            expect(isValidEntityId("   ")).toBe(false);
            expect(isValidEntityId(null)).toBe(false);
            expect(isValidEntityId(undefined)).toBe(false);
            expect(isValidEntityId(123)).toBe(false);
            expect(isValidEntityId({})).toBe(false);
            expect(isValidEntityId([])).toBe(false);
        });
    });

    describe("entityIdToString()", () => {
        it("EntityId değerini string olarak döndürür", () => {
            const id = createEntityId<"User">("user-5");
            expect(entityIdToString(id)).toBe("user-5");
        });
    });
});
