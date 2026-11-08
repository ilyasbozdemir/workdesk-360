import { dataMapping } from './data.mapping';
import { muayeneKabulRoute } from './route.definition';

export const definition = {
  id: 'muayene-kabul-komisyonu',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: muayeneKabulRoute,
};
