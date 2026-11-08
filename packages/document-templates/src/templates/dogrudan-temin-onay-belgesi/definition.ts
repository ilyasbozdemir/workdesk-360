import { dataMapping } from './data.mapping';
import { onayBelgesiRoute } from './route.definition';

export const definition = {
  id: 'dogrudan-temin-onay-belgesi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: onayBelgesiRoute,
};
