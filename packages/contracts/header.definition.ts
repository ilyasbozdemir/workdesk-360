/**
 * RESMÎ ANTET VE LOGO YERLEŞİM SÖZLEŞMESİ (HEADER DEFINITION)
 * 
 * Bu sözleşme; Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik,
 * TBB Resmî Yazışma Kılavuzu ve kurum hiyerarşisi (Üst Kurum, Bağlı İdare, Bağımsız Kurum vb.)
 * doğrultusunda belge şablonlarının antet ve logo yerleşimini tip-güvenli (discriminated union)
 * ve key tabanlı dinamik veri kaynağı eşlemesiyle (HeaderLineDefinition) tanımlar.
 * 
 * Desteklenen Yerleşimler:
 * - "none": Logosu olmayan kurumlar veya sade yazışmalar
 * - "single": Sol, Orta veya Sağ konumlu tekil logo (Örn: T.C. Valilik veya Belediye Başkanlığı)
 * - "dual": Çift logo (Sol ve Sağ); örneğin solda bakanlık/valilik, sağda bağlı idare/belediye
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
 * Antet metin hizalama yönü
 */
export type HeaderAlignment = "left" | "center" | "right";

/**
 * Antet profil tipi:
 * - "official": Resmî Yazışma Yönetmeliği hiyerarşisine (T.C. -> Üst Kurum -> Kurum -> Birim) sıkı bağlı
 * - "custom": Esnek veya özel kurum formatı
 */
export type HeaderProfile = "official" | "custom";

/**
 * Antet satırının veri kaynağı:
 * - "settings": Kurum genel ayarlarından (TANIM_Kurum, settings tablosu)
 * - "document": Aktif temin dosyasından ve birim ilişkilerinden (DATA_TeminDosyasi, TANIM_Birim)
 * - "manual": Şablon veya kullanıcı tarafından doğrudan girilen manuel override
 */
export type HeaderLineSource = "settings" | "document" | "manual";

/**
 * Key tabanlı dinamik antet satır tanımı.
 * Her satır bağımsız bir key taşır, sıralanabilir ve mevcut mapping sistemi üzerinden beslenebilir.
 */
export interface HeaderLineDefinition {
  /** Satırın sabit, benzersiz kimliği (Örn: 'countryPrefix', 'institutionName', 'tenderUnit') */
  key: string;
  /** Verinin çözümleneceği kaynak havuzu */
  source: HeaderLineSource;
  /** Kaynak havuzu içerisindeki veri yolu (Örn: 'resolvedTenderUnit.name', 'settings.institutionName') */
  path: string;
  /** Satırın görünürlük durumu (varsayılan: true) */
  visible?: boolean;
  /** Satırın zorunlu olup olmadığı (varsayılan: false) */
  required?: boolean;
  /** Kaynaktan değer çözülemezse kullanılacak varsayılan metin */
  fallback?: string;
}

/**
 * Temel antet meta ve satır sözleşmesi
 */
export interface BaseHeaderDefinition {
  /** Profil türü: Resmî yazışma ("official") veya esnek ("custom") */
  profile?: HeaderProfile;
  /** Antet metin hizalaması (varsayılan: "center") */
  alignment?: HeaderAlignment;
  /** Sıralı antet satır tanımları */
  lines?: HeaderLineDefinition[];
  /** Alias: lines ile eşdeğerdir */
  fields?: HeaderLineDefinition[];
}

/**
 * Tip güvenli ayrık birlik (Discriminated Union) antet ve logo sözleşmesi.
 * logoMode ile logo alanlarının çelişmesi TypeScript derleyicisi seviyesinde önlenir.
 */
export type HeaderDefinition =
  | (BaseHeaderDefinition & {
      logoMode: "none";
      leftLogo?: never;
      centerLogo?: never;
      rightLogo?: never;
    })
  | (BaseHeaderDefinition & {
      logoMode: "single";
      position: SingleLogoPosition;
      logo: HeaderLogoSource;
    })
  | (BaseHeaderDefinition & {
      logoMode: "dual";
      leftLogo: HeaderLogoSource;
      rightLogo: HeaderLogoSource;
    });

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
 * Standart Resmî Yazışma Antet Satırları (Hiyerarşi: T.C. -> Üst Kurum -> İdare/Kurum -> İhaleyi Yapan Birim)
 */
export const DEFAULT_OFFICIAL_HEADER_LINES: HeaderLineDefinition[] = [
  {
    key: "countryPrefix",
    source: "settings",
    path: "countryPrefix",
    fallback: "T.C.",
    required: true,
    visible: true,
  },
  {
    key: "parentInstitution",
    source: "settings",
    path: "parentInstitution",
    visible: true,
  },
  {
    key: "institutionName",
    source: "settings",
    path: "institutionName",
    required: true,
    visible: true,
  },
  {
    key: "tenderUnit",
    source: "document",
    path: "resolvedTenderUnit.name",
    visible: true,
  },
];

/**
 * Varsayılan standart resmi kurum antet yerleşimi (Tekil sol logo + Resmi Satırlar)
 */
export const DEFAULT_OFFICIAL_HEADER: HeaderDefinition = {
  logoMode: "single",
  position: "left",
  logo: "institution",
  profile: "official",
  alignment: "center",
  lines: DEFAULT_OFFICIAL_HEADER_LINES,
};

/**
 * Çift logolu standart resmi kurum antet yerleşimi
 * (Solda üst kurum/bakanlık, sağda bağlı idare/kurum)
 */
export const DUAL_INSTITUTION_HEADER: HeaderDefinition = {
  logoMode: "dual",
  leftLogo: "parentInstitution",
  rightLogo: "institution",
  profile: "official",
  alignment: "center",
  lines: DEFAULT_OFFICIAL_HEADER_LINES,
};

/**
 * İki tarafta aynı kurum logosunun kullanıldığı çift logolu yerleşim
 */
export const DUAL_SYMMETRIC_HEADER: HeaderDefinition = {
  logoMode: "dual",
  leftLogo: "institution",
  rightLogo: "institution",
  profile: "official",
  alignment: "center",
  lines: DEFAULT_OFFICIAL_HEADER_LINES,
};

/**
 * Ortalanmış tek logolu resmi antet yerleşimi
 */
export const CENTER_LOGO_HEADER: HeaderDefinition = {
  logoMode: "single",
  position: "center",
  logo: "institution",
  profile: "official",
  alignment: "center",
  lines: DEFAULT_OFFICIAL_HEADER_LINES,
};

/**
 * Logosuz sade antet yerleşimi
 */
export const NO_LOGO_HEADER: HeaderDefinition = {
  logoMode: "none",
  profile: "official",
  alignment: "center",
  lines: DEFAULT_OFFICIAL_HEADER_LINES,
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
 * HeaderDefinition için satır listesini (lines veya fields alias) döndürür
 */
export function getHeaderLines(def: HeaderDefinition): HeaderLineDefinition[] {
  if (Array.isArray(def.lines) && def.lines.length > 0) {
    return def.lines;
  }
  if (Array.isArray(def.fields) && def.fields.length > 0) {
    return def.fields;
  }
  return DEFAULT_OFFICIAL_HEADER_LINES;
}

/**
 * HeaderDefinition tanımını doğrular:
 * - Aynı tanım içinde yinelenen (duplicate) key'ler bulunamaz.
 * - Satırlarda key, source ve path zorunludur.
 * - "official" profilinde T.C. en üstte olmalıdır (eğer tanımlıysa).
 */
export function validateHeaderDefinition(def: HeaderDefinition): void {
  const lines = getHeaderLines(def);
  const seenKeys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (!line.key || typeof line.key !== "string" || !line.key.trim()) {
      throw new Error(`Antet satırı [${i}] için geçerli bir 'key' zorunludur.`);
    }

    const trimmedKey = line.key.trim();
    if (seenKeys.has(trimmedKey)) {
      throw new Error(`Yinelenen antet satır key'i: "${trimmedKey}" (İndeks: ${i})`);
    }
    seenKeys.add(trimmedKey);

    if (!line.source || !["settings", "document", "manual"].includes(line.source)) {
      throw new Error(
        `Antet satırı "${trimmedKey}" için geçerli bir source ("settings" | "document" | "manual") zorunludur.`
      );
    }

    if (!line.path || typeof line.path !== "string" || !line.path.trim()) {
      throw new Error(`Antet satırı "${trimmedKey}" için geçerli bir 'path' zorunludur.`);
    }
  }

  // Resmî profil doğrulaması: T.C. ülke öneki varsa en üstte yer almalıdır
  if (def.profile === "official" || !def.profile) {
    const countryIndex = lines.findIndex(
      (l) => l.key === "countryPrefix" || l.fallback === "T.C."
    );
    if (countryIndex > 0) {
      throw new Error(
        `Resmî antet profilinde "countryPrefix" (T.C.) en üstte (ilk satır) yer almalıdır.`
      );
    }
  }
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
