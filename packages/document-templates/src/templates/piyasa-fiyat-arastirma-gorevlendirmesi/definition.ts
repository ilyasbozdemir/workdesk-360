import { dataMapping } from './data.mapping';
import { piyasaFiyatGorevlendirmeRoute } from './route.definition';

export const definition = {
  id: 'piyasa-fiyat-arastirma-gorevlendirmesi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: piyasaFiyatGorevlendirmeRoute,
};
