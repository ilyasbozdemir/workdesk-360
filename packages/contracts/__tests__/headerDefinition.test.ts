import { describe, expect, it } from "vitest";
import {
  CENTER_LOGO_HEADER,
  DEFAULT_OFFICIAL_HEADER,
  DEFAULT_OFFICIAL_HEADER_LINES,
  DUAL_INSTITUTION_HEADER,
  DUAL_SYMMETRIC_HEADER,
  getHeaderLines,
  HeaderDefinition,
  isDualLogoHeader,
  isNoLogoHeader,
  isSingleLogoHeader,
  NO_LOGO_HEADER,
  resolveHeaderLogos,
  validateHeaderDefinition,
} from "../header.definition";

describe("HeaderDefinition & Dynamic Antet Mimarisi Sözleşme Testleri", () => {
  it("standart resmî antet satırlarını ve varsayılan alanları doğru döner", () => {
    expect(DEFAULT_OFFICIAL_HEADER_LINES.length).toBe(4);
    expect(DEFAULT_OFFICIAL_HEADER_LINES[0].key).toBe("countryPrefix");
    expect(DEFAULT_OFFICIAL_HEADER_LINES[0].fallback).toBe("T.C.");
    expect(DEFAULT_OFFICIAL_HEADER_LINES[1].key).toBe("parentInstitution");
    expect(DEFAULT_OFFICIAL_HEADER_LINES[2].key).toBe("institutionName");
    expect(DEFAULT_OFFICIAL_HEADER_LINES[3].key).toBe("tenderUnit");

    expect(DEFAULT_OFFICIAL_HEADER.logoMode).toBe("single");
    expect(DEFAULT_OFFICIAL_HEADER.profile).toBe("official");
    expect(getHeaderLines(DEFAULT_OFFICIAL_HEADER)).toEqual(DEFAULT_OFFICIAL_HEADER_LINES);
  });

  it("geçerli resmi ve özel antet tanımlarını hatasız doğrular", () => {
    expect(() => validateHeaderDefinition(DEFAULT_OFFICIAL_HEADER)).not.toThrow();
    expect(() => validateHeaderDefinition(DUAL_INSTITUTION_HEADER)).not.toThrow();
    expect(() => validateHeaderDefinition(DUAL_SYMMETRIC_HEADER)).not.toThrow();
    expect(() => validateHeaderDefinition(CENTER_LOGO_HEADER)).not.toThrow();
    expect(() => validateHeaderDefinition(NO_LOGO_HEADER)).not.toThrow();
  });

  it("aynı tanım içinde yinelenen (duplicate) key bulunursa hata fırlatır", () => {
    const invalidDef: HeaderDefinition = {
      logoMode: "none",
      lines: [
        { key: "institution", source: "settings", path: "institutionName" },
        { key: "institution", source: "settings", path: "institutionName" },
      ],
    };

    expect(() => validateHeaderDefinition(invalidDef)).toThrow(
      /Yinelenen antet satır key'i: "institution"/
    );
  });

  it("geçersiz source veya eksik path içeren satırlarda doğrulama hatası verir", () => {
    const missingSource: any = {
      logoMode: "none",
      lines: [{ key: "test", path: "test.path" }],
    };
    expect(() => validateHeaderDefinition(missingSource)).toThrow(/geçerli bir source/);

    const missingPath: any = {
      logoMode: "none",
      lines: [{ key: "test", source: "document", path: "" }],
    };
    expect(() => validateHeaderDefinition(missingPath)).toThrow(/geçerli bir 'path'/);
  });

  it("resmî profil modunda T.C. (countryPrefix) en üstte değilse hata fırlatır", () => {
    const wrongOrderDef: HeaderDefinition = {
      logoMode: "single",
      position: "left",
      logo: "institution",
      profile: "official",
      lines: [
        { key: "institutionName", source: "settings", path: "institutionName" },
        { key: "countryPrefix", source: "settings", path: "countryPrefix", fallback: "T.C." },
      ],
    };

    expect(() => validateHeaderDefinition(wrongOrderDef)).toThrow(
      /Resmî antet profilinde "countryPrefix" \(T\.C\.\) en üstte/
    );
  });

  it("özel (custom) profilde esnek sıralamaya izin verir", () => {
    const customDef: HeaderDefinition = {
      logoMode: "none",
      profile: "custom",
      lines: [
        { key: "unit", source: "document", path: "birimAdi" },
        { key: "customText", source: "manual", path: "customText" },
      ],
    };

    expect(() => validateHeaderDefinition(customDef)).not.toThrow();
  });

  it("type guards doğru ayrım yapar", () => {
    expect(isSingleLogoHeader(DEFAULT_OFFICIAL_HEADER)).toBe(true);
    expect(isDualLogoHeader(DEFAULT_OFFICIAL_HEADER)).toBe(false);
    expect(isNoLogoHeader(DEFAULT_OFFICIAL_HEADER)).toBe(false);

    expect(isDualLogoHeader(DUAL_INSTITUTION_HEADER)).toBe(true);
    expect(isSingleLogoHeader(DUAL_INSTITUTION_HEADER)).toBe(false);

    expect(isNoLogoHeader(NO_LOGO_HEADER)).toBe(true);
  });

  it("resolveHeaderLogos tekil ve çift logoları kaynaktan çözer", () => {
    const pool = {
      institutionLogo: "inst.png",
      parentInstitutionLogo: "parent.png",
    };

    // Tekil sol logo
    const leftRes = resolveHeaderLogos(DEFAULT_OFFICIAL_HEADER, pool);
    expect(leftRes.solLogo).toBe("inst.png");
    expect(leftRes.ortaLogo).toBeNull();
    expect(leftRes.sagLogo).toBeNull();

    // Çift logo: Solda üst kurum, sağda bağlı kurum
    const dualRes = resolveHeaderLogos(DUAL_INSTITUTION_HEADER, pool);
    expect(dualRes.solLogo).toBe("parent.png");
    expect(dualRes.sagLogo).toBe("inst.png");
  });
});

