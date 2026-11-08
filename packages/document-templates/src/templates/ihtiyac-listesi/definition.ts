import { dataMapping } from './data.mapping';
import { ihtiyacListesiRoute } from './route.definition';

export const definition = {
  id: 'ihtiyac-listesi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: ihtiyacListesiRoute,
};
