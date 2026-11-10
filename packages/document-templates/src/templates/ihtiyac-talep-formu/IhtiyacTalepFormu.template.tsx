import { ColumnDef } from "../../document/DocumentTable";
import { IhtiyacTalepFormuType } from "./IhtiyacTalepFormu.schema";
import {
  AlimTuru,
  detectAlimTuru,
} from "../ihtiyac-listesi/IhtiyacListesi.template";
import { MalAlimiIhtiyacTalepFormu } from "./MalAlimi/MalAlimiIhtiyacTalepFormu";
import { HizmetAlimiIhtiyacTalepFormu } from "./HizmetAlimi/HizmetAlimiIhtiyacTalepFormu";
import { DanismanlikIhtiyacTalepFormu } from "./DanismanlikHizmetAlimi/DanismanlikIhtiyacTalepFormu";
import { YapimIsleriIhtiyacTalepFormu } from "./YapimIsleri/YapimIsleriIhtiyacTalepFormu";

export { type AlimTuru, detectAlimTuru };

export interface IhtiyacTalepFormuProps {
  data?: Partial<IhtiyacTalepFormuType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  alimTuru?: AlimTuru;
}

/**
 * İhtiyaç Talep Formu Ana Şablonu (IhtiyacTalepFormu)
 * Alım türüne (Mal, Hizmet, Danışmanlık, Yapım İşleri) göre ilgili alt şablonu otomatik olarak yönlendirir ve çizer.
 */
export function IhtiyacTalepFormu(props: IhtiyacTalepFormuProps) {
  const tur = props.alimTuru || detectAlimTuru(props.data);

  switch (tur) {
    case "yapim":
      return <YapimIsleriIhtiyacTalepFormu {...props} />;
    case "hizmet":
      return <HizmetAlimiIhtiyacTalepFormu {...props} />;
    case "danismanlik":
      return <DanismanlikIhtiyacTalepFormu {...props} />;
    case "mal":
    default:
      return <MalAlimiIhtiyacTalepFormu {...props} />;
  }
}
