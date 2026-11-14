import React from "react";
import {
  AlimTuru,
  detectAlimTuru,
} from "../ihtiyac-listesi/IhtiyacListesi.template";
import { BaseLuzumMuzekkeresiOnayEkiProps } from "./BaseLuzumMuzekkeresiOnayEki";
import { MalAlimiLuzumMuzekkeresiOnayEki } from "./MalAlimi/MalAlimiLuzumMuzekkeresiOnayEki";
import { HizmetAlimiLuzumMuzekkeresiOnayEki } from "./HizmetAlimi/HizmetAlimiLuzumMuzekkeresiOnayEki";
import { DanismanlikLuzumMuzekkeresiOnayEki } from "./DanismanlikHizmetAlimi/DanismanlikLuzumMuzekkeresiOnayEki";
import { YapimIsleriLuzumMuzekkeresiOnayEki } from "./YapimIsleri/YapimIsleriLuzumMuzekkeresiOnayEki";

export function LuzumMuzekkeresiOnayEki(props: BaseLuzumMuzekkeresiOnayEkiProps) {
  const alimTuru = (props.data as any)?.alimTuru || detectAlimTuru(props.data);

  switch (alimTuru) {
    case "hizmet":
      return <HizmetAlimiLuzumMuzekkeresiOnayEki {...props} />;
    case "danismanlik":
      return <DanismanlikLuzumMuzekkeresiOnayEki {...props} />;
    case "yapim":
      return <YapimIsleriLuzumMuzekkeresiOnayEki {...props} />;
    case "mal":
    default:
      return <MalAlimiLuzumMuzekkeresiOnayEki {...props} />;
  }
}
