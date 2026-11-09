import { ColumnDef } from "../../document/DocumentTable";
import { IhtiyacListesiType } from "./IhtiyacListesi.schema";
import { MalAlimiIhtiyacListesi } from "./MalAlimi/MalAlimiIhtiyacListesi";
import { HizmetAlimiIhtiyacListesi } from "./HizmetAlimi/HizmetAlimiIhtiyacListesi";
import { DanismanlikIhtiyacListesi } from "./DanismanlikHizmetAlimi/DanismanlikIhtiyacListesi";
import { YapimIsleriIhtiyacListesi } from "./YapimIsleri/YapimIsleriIhtiyacListesi";

export type AlimTuru = "mal" | "hizmet" | "danismanlik" | "yapim";

/**
 * Belge verisindeki alım türünü tespit eder (mal, hizmet, yapım, danışmanlık).
 */
export function detectAlimTuru(data?: Record<string, any>): AlimTuru {
  if (!data) return "mal";
  const raw = String(
    data.alimTuru ||
      data.alim_turu ||
      data.tur ||
      data.isinTuru ||
      data.dosyaRecord?.tur ||
      data.dosyaRecord?.alim_turu ||
      "",
  )
    .toLowerCase()
    .trim();

  if (
    raw.includes("yapim") ||
    raw.includes("yapım") ||
    raw.includes("insaat") ||
    raw.includes("inşaat")
  ) {
    return "yapim";
  }
  if (raw.includes("danisman") || raw.includes("danışman")) {
    return "danismanlik";
  }
  if (raw.includes("hizmet")) {
    return "hizmet";
  }
  return "mal";
}

export interface IhtiyacListesiProps {
  data?: Partial<IhtiyacListesiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  alimTuru?: AlimTuru;
}

/**
 * İhtiyaç Listesi Ana Şablonu (IhtiyacListesi)
 * Alım türüne (Mal, Hizmet, Danışmanlık, Yapım İşleri) göre ilgili alt şablonu otomatik olarak yönlendirir ve çizer.
 */
export function IhtiyacListesi(props: IhtiyacListesiProps) {
  const tur = props.alimTuru || detectAlimTuru(props.data);

  switch (tur) {
    case "yapim":
      return <YapimIsleriIhtiyacListesi {...props} />;
    case "hizmet":
      return <HizmetAlimiIhtiyacListesi {...props} />;
    case "danismanlik":
      return <DanismanlikIhtiyacListesi {...props} />;
    case "mal":
    default:
      return <MalAlimiIhtiyacListesi {...props} />;
  }
}
