import { describe, expect, it } from "vitest";
import { onayBelgesiRoute } from "../route.definition";

describe("DogrudanTeminOnayBelgesi — Route Definition Testleri", () => {
  it("1. Rota şablon id'si ve versiyonu doğru tanımlanmıştır", () => {
    expect(onayBelgesiRoute.templateId).toBe("dogrudan-temin-onay-belgesi");
    expect(onayBelgesiRoute.version).toBe(1);
  });

  it("2. Zorunlu slotlar (gerceklestirmeGorevlisi ve onaylayan) eksiksiz yapılandırılmıştır", () => {
    const gerceklestirmeSlot = onayBelgesiRoute.slots.find(
      (s) => s.id === "gerceklestirmeGorevlisi"
    );
    expect(gerceklestirmeSlot).toBeDefined();
    expect(gerceklestirmeSlot?.required).toBe(true);
    expect(gerceklestirmeSlot?.kind).toBe("person");
    expect(gerceklestirmeSlot?.fieldKey).toBe("hazirlayanPersonelAdi");

    const onaylayanSlot = onayBelgesiRoute.slots.find(
      (s) => s.id === "onaylayan"
    );
    expect(onaylayanSlot).toBeDefined();
    expect(onaylayanSlot?.required).toBe(true);
    expect(onaylayanSlot?.kind).toBe("person");
    expect(onaylayanSlot?.fieldKey).toBe("onaylayanPersonelAdi");
  });

  it("3. Opsiyonel sunulacakMakam slotu tanımlanmıştır", () => {
    const makamSlot = onayBelgesiRoute.slots.find(
      (s) => s.id === "sunulacakMakam"
    );
    expect(makamSlot).toBeDefined();
    expect(makamSlot?.required).toBe(false);
    expect(makamSlot?.kind).toBe("unit");
    expect(makamSlot?.fieldKey).toBe("sunulacakMakamAdi");
  });
});
