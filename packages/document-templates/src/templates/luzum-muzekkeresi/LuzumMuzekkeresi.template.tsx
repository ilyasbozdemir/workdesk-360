import { ColumnDef } from "../../document/DocumentTable";
import { LuzumMuzekkeresiType } from "./LuzumMuzekkeresi.schema";
import { MalAlimiLuzumMuzekkeresi } from "./MalAlimi/MalAlimiLuzumMuzekkeresi";
import { HizmetAlimiLuzumMuzekkeresi } from "./HizmetAlimi/HizmetAlimiLuzumMuzekkeresi";
import { DanismanlikLuzumMuzekkeresi } from "./DanismanlikHizmetAlimi/DanismanlikLuzumMuzekkeresi";
import { YapimIsleriLuzumMuzekkeresi } from "./YapimIsleri/YapimIsleriLuzumMuzekkeresi";
import { AlimTuru, detectAlimTuru } from "../ihtiyac-listesi/IhtiyacListesi.template";

export interface LuzumMuzekkeresiProps {
  data?: Partial<LuzumMuzekkeresiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  alimTuru?: AlimTuru;
}

/**
 * Lüzum Müzekkeresi Ana Şablonu (LuzumMuzekkeresi)
 * Alım türüne (Mal, Hizmet, Danışmanlık, Yapım İşleri) göre ilgili alt şablonu otomatik olarak yönlendirir ve çizer.
 */
export function LuzumMuzekkeresi(props: LuzumMuzekkeresiProps) {
  const tur = props.alimTuru || detectAlimTuru(props.data);

  switch (tur) {
    case "yapim":
      return <YapimIsleriLuzumMuzekkeresi {...props} />;
    case "hizmet":
      return <HizmetAlimiLuzumMuzekkeresi {...props} />;
    case "danismanlik":
      return <DanismanlikLuzumMuzekkeresi {...props} />;
    case "mal":
    default:
      return <MalAlimiLuzumMuzekkeresi {...props} />;
  }
}
