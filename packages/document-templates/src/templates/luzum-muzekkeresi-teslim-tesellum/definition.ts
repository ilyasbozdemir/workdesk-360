import { dataMapping } from './data.mapping';
import { luzumMuzekkeresiTeslimTesellumRoute } from './route.definition';

export const definition = {
  id: 'luzum-muzekkeresi-teslim-tesellum',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: luzumMuzekkeresiTeslimTesellumRoute,
};
