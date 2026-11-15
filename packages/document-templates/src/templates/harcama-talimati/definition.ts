import { dataMapping } from './data.mapping';
import { harcamaTalimatiRoute } from './route.definition';

export const definition = {
  id: 'harcama-talimati',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: harcamaTalimatiRoute,
};
