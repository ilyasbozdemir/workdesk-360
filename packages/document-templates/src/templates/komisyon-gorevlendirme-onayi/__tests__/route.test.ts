import { describe, expect, it } from "vitest";
import { komisyonGorevlendirmeRoute } from "../route.definition";

describe("KomisyonGorevlendirmeOnayi — Rota ve Slot Tanımları", () => {
  it("1. Görevlendirme onay rotası doğru slot yapılandırmasına sahiptir", () => {
    expect(komisyonGorevlendirmeRoute.templateId).toBe(
      "komisyon-gorevlendirme-onayi",
    );
    expect(komisyonGorevlendirmeRoute.isAppointmentDocument).toBe(true);

    const slotIds = komisyonGorevlendirmeRoute.slots.map((s) => s.id);
    expect(slotIds).toContain("komisyon");
    expect(slotIds).toContain("onaylayan");
  });

  it("2. Komisyon slotu person-list türünde ve required olmalıdır", () => {
    const komisyonSlot = komisyonGorevlendirmeRoute.slots.find((s) =>
      s.id === "komisyon"
    );
    expect(komisyonSlot).toBeDefined();
    expect(komisyonSlot?.kind).toBe("person-list");
    expect(komisyonSlot?.required).toBe(true);
  });

  it("3. Onaylayan slotu settings varsayılan kaynaklı olmalıdır", () => {
    const onaylayanSlot = komisyonGorevlendirmeRoute.slots.find((s) =>
      s.id === "onaylayan"
    );
    expect(onaylayanSlot).toBeDefined();
    expect(onaylayanSlot?.defaultSource).toBe("settings");
    expect(onaylayanSlot?.required).toBe(true);
  });
});
