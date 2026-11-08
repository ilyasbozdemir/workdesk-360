export const ALIM_USULLERI = {
  ACIK_IHALE: "Açık İhale Usulü",
  BELLI_ISTEKLILER: "Belli İstekliler Arasında İhale Usulü",
  PAZARLIK: "Pazarlık Usulü",
  DOGRUDAN_TEMIN: "Doğrudan Temin",
} as const;

export type AlimUsulu =
  (typeof ALIM_USULLERI)[keyof typeof ALIM_USULLERI];