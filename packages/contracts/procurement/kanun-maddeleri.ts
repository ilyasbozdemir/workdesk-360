export const KANUN_MADDELERI = {
  GENEL: "ilgili",
  ACIK_IHALE: "19",
  PAZARLIK_USULU: "21",
  DOGRUDAN_TEMIN_A: "22/a",
  DOGRUDAN_TEMIN_B: "22/b",
  DOGRUDAN_TEMIN_C: "22/c",
  DOGRUDAN_TEMIN_D: "22/d",
} as const;

export type KanunMaddesi =
  (typeof KANUN_MADDELERI)[keyof typeof KANUN_MADDELERI];