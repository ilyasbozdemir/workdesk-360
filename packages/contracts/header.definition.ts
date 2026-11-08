/**
 * RESMÎ ANTET VE LOGO YERLEŞİM SÖZLEŞMESİ (HEADER DEFINITION)
 * 
 * Bu sözleşme; Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik
 * ve kurum hiyerarşisi (Üst Kurum, Bağlı İdare, Bağımsız Kurum vb.) doğrultusunda
 * belge şablonlarının antet ve logo yerleşimini tip-güvenli (discriminated union)
 * olarak tanımlar.
 * 
 * Desteklenen Yerleşimler:
 * - "none": Logosu olmayan kurumlar veya sade yazışmalar
 * - "single": Sol, Orta veya Sağ konumlu tekil logo (Örn: T.C. Valilik veya Belediye Başkanlığı)
 * - "dual": Çift logo (Sol ve Sağ); örneğin solda bakanlık/valilik, sağda bağlı genel müdürlük/belediye
 *           veya her iki tarafta aynı kurum logosu.
 */

/**
 * Antette kullanılacak logonun kaynağı:
 * - "institution": İlgili kurumun kendi logosu
 * - "parentInstitution": Bağlı olunan üst kurum/bakanlık logosu
 * - "custom": Şablona veya sürece özel harici/yüklenen logo
 */
export type HeaderLogoSource =
  | "institution"
  | "parentInstitution"
  | "custom";

/**
 * Antet logo yerleşim modu
 */
export type HeaderLogoMode =
  | "none"
  | "single"
  | "dual";

/**
 * Tekil logo yerleşim konumu
 */
export type SingleLogoPosition = "left" | "center" | "right";

/**
 * Tip güvenli ayrık birlik (Discriminated Union) antet sözleşmesi.
 * logoMode ile logo alanlarının çelişmesi TypeScript derleyicisi seviyesinde önlenir.
 */
export type HeaderDefinition =
  | {
      logoMode: "none";
      leftLogo?: never;
      centerLogo?: never;
      rightLogo?: never;
    }
  | {
      logoMode: "single";
      position: SingleLogoPosition;
      logo: HeaderLogoSource;
    }
  | {
      logoMode: "dual";
      leftLogo: HeaderLogoSource;
      rightLogo: HeaderLogoSource;
    };

/**
 * Resmî Yazışma Yönetmeliği ve Antet Yerleşim Standartları
 * Temin 360 monoreposunda tüm şablonlar bu ortak ölçüleri referans alır.
 */
export const OFFICIAL_HEADER_LAYOUT = {
  pageMargin: {
    top: 1.5,
    left: 1.5,
    right: 1.5,
  },
  logoTopMargin: 0.5,
  unit: "cm",
} as const;

export type OfficialHeaderLayout = typeof OFFICIAL_HEADER_LAYOUT;

/**
 * Varsayılan standart resmi kurum antet yerleşimi (Tekil sol logo)
 */
export const DEFAULT_OFFICIAL_HEADER: HeaderDefinition = {
  logoMode: "single",
  position: "left",
  logo: "institution",
};

/**
 * Çift logolu standart resmi kurum antet yerleşimi
 * (Solda üst kurum/bakanlık, sağda bağlı idare/kurum)
 */
export const DUAL_INSTITUTION_HEADER: HeaderDefinition = {
  logoMode: "dual",
  leftLogo: "parentInstitution",
  rightLogo: "institution",
};

/**
 * İki tarafta aynı kurum logosunun kullanıldığı çift logolu yerleşim
 */
export const DUAL_SYMMETRIC_HEADER: HeaderDefinition = {
  logoMode: "dual",
  leftLogo: "institution",
  rightLogo: "institution",
};

/**
 * Ortalanmış tek logolu resmi antet yerleşimi
 */
export const CENTER_LOGO_HEADER: HeaderDefinition = {
  logoMode: "single",
  position: "center",
  logo: "institution",
};

/**
 * Type Guard: Tekil logo yerleşimi mi?
 */
export function isSingleLogoHeader(
  def: HeaderDefinition
): def is Extract<HeaderDefinition, { logoMode: "single" }> {
  return def.logoMode === "single";
}

/**
 * Type Guard: Çift logo yerleşimi mi?
 */
export function isDualLogoHeader(
  def: HeaderDefinition
): def is Extract<HeaderDefinition, { logoMode: "dual" }> {
  return def.logoMode === "dual";
}

/**
 * Type Guard: Logosuz antet mi?
 */
export function isNoLogoHeader(
  def: HeaderDefinition
): def is Extract<HeaderDefinition, { logoMode: "none" }> {
  return def.logoMode === "none";
}

/**
 * Logo kaynak havuzundan görsel URL/Base64 karşılıklarını çözer
 */
export interface ResolvedHeaderLogos {
  solLogo?: string | null;
  ortaLogo?: string | null;
  sagLogo?: string | null;
}

export interface HeaderLogoSourcesPool {
  institutionLogo?: string | null;
  parentInstitutionLogo?: string | null;
  customLogo?: string | null;
}

/**
 * Belirtilen HeaderDefinition sözleşmesine ve sağlanan logo havuzuna göre
 * sol, orta ve sağ logo adreslerini çözen yardımcı fonksiyon.
 */
export function resolveHeaderLogos(
  def: HeaderDefinition,
  pool: HeaderLogoSourcesPool
): ResolvedHeaderLogos {
  const getLogoFromSource = (src: HeaderLogoSource): string | null => {
    switch (src) {
      case "institution":
        return pool.institutionLogo || null;
      case "parentInstitution":
        return pool.parentInstitutionLogo || pool.institutionLogo || null;
      case "custom":
        return pool.customLogo || pool.institutionLogo || null;
      default:
        return null;
    }
  };

  if (def.logoMode === "none") {
    return { solLogo: null, ortaLogo: null, sagLogo: null };
  }

  if (def.logoMode === "single") {
    const url = getLogoFromSource(def.logo);
    return {
      solLogo: def.position === "left" ? url : null,
      ortaLogo: def.position === "center" ? url : null,
      sagLogo: def.position === "right" ? url : null,
    };
  }

  return {
    solLogo: getLogoFromSource(def.leftLogo),
    ortaLogo: null,
    sagLogo: getLogoFromSource(def.rightLogo),
  };
}

