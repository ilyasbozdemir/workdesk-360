import { dataMapping } from './data.mapping';
import { piyasaFiyatRoute } from './route.definition';

export const definition = {
  id: 'piyasa-fiyat-arastirma-tutanagi',
  version: 1,
  dataMapping,
  mapping: dataMapping,
  routeDefinition: piyasaFiyatRoute,
};
