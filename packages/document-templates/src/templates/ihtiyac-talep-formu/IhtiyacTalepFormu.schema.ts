import { z } from 'zod';
import { MalAlimiIhtiyacTalepFormuSchema } from './MalAlimi/MalAlimiIhtiyacTalepFormu.schema';
import { HizmetAlimiIhtiyacTalepFormuSchema } from './HizmetAlimi/HizmetAlimiIhtiyacTalepFormu.schema';
import { DanismanlikIhtiyacTalepFormuSchema } from './DanismanlikHizmetAlimi/DanismanlikIhtiyacTalepFormu.schema';
import { YapimIsleriIhtiyacTalepFormuSchema } from './YapimIsleri/YapimIsleriIhtiyacTalepFormu.schema';

export * from './MalAlimi/MalAlimiIhtiyacTalepFormu.schema';
export * from './HizmetAlimi/HizmetAlimiIhtiyacTalepFormu.schema';
export * from './DanismanlikHizmetAlimi/DanismanlikIhtiyacTalepFormu.schema';
export * from './YapimIsleri/YapimIsleriIhtiyacTalepFormu.schema';

export const IhtiyacTalepFormuSchema = z.union([
  MalAlimiIhtiyacTalepFormuSchema,
  HizmetAlimiIhtiyacTalepFormuSchema,
  DanismanlikIhtiyacTalepFormuSchema,
  YapimIsleriIhtiyacTalepFormuSchema,
]);

export type IhtiyacTalepFormuType =
  | z.infer<typeof MalAlimiIhtiyacTalepFormuSchema>
  | z.infer<typeof HizmetAlimiIhtiyacTalepFormuSchema>
  | z.infer<typeof DanismanlikIhtiyacTalepFormuSchema>
  | z.infer<typeof YapimIsleriIhtiyacTalepFormuSchema>;
