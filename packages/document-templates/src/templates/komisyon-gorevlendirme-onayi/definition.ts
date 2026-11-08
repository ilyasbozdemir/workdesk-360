import { dataMapping } from './data.mapping';
import { komisyonGorevlendirmeRoute } from './route.definition';

export const definition = {
  id: 'komisyon-gorevlendirme-onayi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: komisyonGorevlendirmeRoute,
};
