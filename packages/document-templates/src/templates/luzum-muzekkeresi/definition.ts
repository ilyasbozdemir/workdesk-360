import { dataMapping } from './data.mapping';
import { luzumMuzekkeresiRoute } from './route.definition';

export const definition = {
  id: 'luzum-muzekkeresi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: luzumMuzekkeresiRoute,
};
