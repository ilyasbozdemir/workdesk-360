
const g = (column: string) => ({
  kind: "column" as const,
  table: "global_settings",
  column,
  whereColumn: "id",
  scopeId: "globalId" as const
});

export const globalFields = {
  "kurum.ad": {
    key: "kurum.ad",
    path: "global.kurum.ad",
    label: "Kurum Adı",
    mapping: g("kurum_ad")
  },

  "kurum.adres": {
    key: "kurum.adres",
    path: "global.kurum.adres",
    label: "Kurum Adresi",
    mapping: g("kurum_adres")
  },

  "kurum.logo": {
    key: "kurum.logo",
    path: "global.kurum.logo",
    label: "Kurum Logosu",
    mapping: g("logo")
  },

  "yetkili.adSoyad": {
    key: "yetkili.adSoyad",
    path: "global.yetkili.adSoyad",
    label: "Yetkili Adı Soyadı",
    mapping: g("yetkili_ad")
  },

  "yetkili.unvan": {
    key: "yetkili.unvan",
    path: "global.yetkili.unvan",
    label: "Yetkili Unvanı",
    mapping: g("yetkili_unvan")
  }
} as const;

export const globalFieldOptions =
  Object.values(globalFields).map((field) => ({
    key: field.key,
    path: field.path,
    label: field.label
  }));
