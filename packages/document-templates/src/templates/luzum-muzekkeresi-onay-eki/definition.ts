import { dataMapping } from "./data.mapping";
import { luzumMuzekkeresiOnayEkiRoute } from "./route.definition";

export const definition = {
  id: "luzum-muzekkeresi-onay-eki",
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: luzumMuzekkeresiOnayEkiRoute,
};
