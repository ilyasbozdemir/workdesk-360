import { dataMapping } from './data.mapping';
import { harcamaPusulasiRoute } from './route.definition';

export const definition = {
  id: 'harcama-pusulasi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: harcamaPusulasiRoute,
};
