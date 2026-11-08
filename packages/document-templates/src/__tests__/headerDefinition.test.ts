import { describe, it, expect } from "vitest";
import {
  HeaderDefinition,
  HeaderLogoSource,
  OFFICIAL_HEADER_LAYOUT,
  DEFAULT_OFFICIAL_HEADER,
  DUAL_INSTITUTION_HEADER,
  DUAL_SYMMETRIC_HEADER,
  CENTER_LOGO_HEADER,
  isSingleLogoHeader,
  isDualLogoHeader,
  isNoLogoHeader,
  resolveHeaderLogos,
} from "@temin360/contracts";

describe("HeaderDefinition & OFFICIAL_HEADER_LAYOUT Sözleşmesi", () => {
  describe("1. TypeScript satisfies HeaderDefinition Kullanım Örnekleri", () => {
    it("Örnek 1: Ortada tek logo yerleşimi satisfies HeaderDefinition doğrulanır", () => {
      const header = {
        logoMode: "single",
        position: "center",
        logo: "institution",
      } satisfies HeaderDefinition;

      expect(header.logoMode).toBe("single");
      expect(header.position).toBe("center");
      expect(header.logo).toBe("institution");
      expect(isSingleLogoHeader(header)).toBe(true);
      expect(isDualLogoHeader(header)).toBe(false);
      expect(isNoLogoHeader(header)).toBe(false);
    });

    it("Örnek 2: Solda tek logo yerleşimi satisfies HeaderDefinition doğrulanır", () => {
      const header = {
        logoMode: "single",
        position: "left",
        logo: "institution",
      } satisfies HeaderDefinition;

      expect(header.logoMode).toBe("single");
      expect(header.position).toBe("left");
      expect(header.logo).toBe("institution");
      expect(isSingleLogoHeader(header)).toBe(true);
    });

    it("Örnek 3: İki tarafta aynı logo yerleşimi (dual symmetric) satisfies HeaderDefinition doğrulanır", () => {
      const header = {
        logoMode: "dual",
        leftLogo: "institution",
        rightLogo: "institution",
      } satisfies HeaderDefinition;

      expect(header.logoMode).toBe("dual");
      expect(header.leftLogo).toBe("institution");
      expect(header.rightLogo).toBe("institution");
      expect(isDualLogoHeader(header)).toBe(true);
      expect(isSingleLogoHeader(header)).toBe(false);
    });

    it("Örnek 4: Solda üst kurum, sağda bağlı idare logosu (dual parent/child)", () => {
      const header = {
        logoMode: "dual",
        leftLogo: "parentInstitution",
        rightLogo: "institution",
      } satisfies HeaderDefinition;

      expect(header.logoMode).toBe("dual");
      expect(header.leftLogo).toBe("parentInstitution");
      expect(header.rightLogo).toBe("institution");
      expect(isDualLogoHeader(header)).toBe(true);
    });

    it("Örnek 5: Logosuz antet yerleşimi (none)", () => {
      const header = {
        logoMode: "none",
      } satisfies HeaderDefinition;

      expect(header.logoMode).toBe("none");
      expect(isNoLogoHeader(header)).toBe(true);
      expect(isSingleLogoHeader(header)).toBe(false);
      expect(isDualLogoHeader(header)).toBe(false);
    });
  });

  describe("2. OFFICIAL_HEADER_LAYOUT Standart Ölçüleri", () => {
    it("Resmi antet kenar boşlukları ve logo marjini standart cm ölçülerinde olmalıdır", () => {
      expect(OFFICIAL_HEADER_LAYOUT.unit).toBe("cm");
      expect(OFFICIAL_HEADER_LAYOUT.pageMargin.top).toBe(1.5);
      expect(OFFICIAL_HEADER_LAYOUT.pageMargin.left).toBe(1.5);
      expect(OFFICIAL_HEADER_LAYOUT.pageMargin.right).toBe(1.5);
      expect(OFFICIAL_HEADER_LAYOUT.logoTopMargin).toBe(0.5);
    });
  });

  describe("3. resolveHeaderLogos Çözümleyici Yardımcısı", () => {
    const mockPool = {
      institutionLogo: "data:image/png;base64,INSTITUTION_LOGO",
      parentInstitutionLogo: "data:image/png;base64,PARENT_LOGO",
      customLogo: "data:image/png;base64,CUSTOM_LOGO",
    };

    it("single left logo için solLogo doldurulur, diğerleri null döner", () => {
      const res = resolveHeaderLogos(DEFAULT_OFFICIAL_HEADER, mockPool);
      expect(res.solLogo).toBe(mockPool.institutionLogo);
      expect(res.ortaLogo).toBeNull();
      expect(res.sagLogo).toBeNull();
    });

    it("single center logo için ortaLogo doldurulur, diğerleri null döner", () => {
      const res = resolveHeaderLogos(CENTER_LOGO_HEADER, mockPool);
      expect(res.solLogo).toBeNull();
      expect(res.ortaLogo).toBe(mockPool.institutionLogo);
      expect(res.sagLogo).toBeNull();
    });

    it("dual parent-child logo için solLogo ve sagLogo ayrı atanır", () => {
      const res = resolveHeaderLogos(DUAL_INSTITUTION_HEADER, mockPool);
      expect(res.solLogo).toBe(mockPool.parentInstitutionLogo);
      expect(res.sagLogo).toBe(mockPool.institutionLogo);
      expect(res.ortaLogo).toBeNull();
    });

    it("dual symmetric logo için solLogo ve sagLogo aynı kuruma atanır", () => {
      const res = resolveHeaderLogos(DUAL_SYMMETRIC_HEADER, mockPool);
      expect(res.solLogo).toBe(mockPool.institutionLogo);
      expect(res.sagLogo).toBe(mockPool.institutionLogo);
      expect(res.ortaLogo).toBeNull();
    });

    it("none için tüm logo adresleri null döner", () => {
      const res = resolveHeaderLogos({ logoMode: "none" }, mockPool);
      expect(res.solLogo).toBeNull();
      expect(res.ortaLogo).toBeNull();
      expect(res.sagLogo).toBeNull();
    });
  });
});

