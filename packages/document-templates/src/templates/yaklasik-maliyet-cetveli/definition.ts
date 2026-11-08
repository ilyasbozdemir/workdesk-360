import { dataMapping } from './data.mapping';
import { yaklasikMaliyetRoute } from './route.definition';

export const definition = {
  id: 'yaklasik-maliyet-cetveli',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: yaklasikMaliyetRoute,
};
