import { z } from "zod";
import { LuzumMuzekkeresiOnayEkiSchema } from "../LuzumMuzekkeresiOnayEki.schema";

export const YapimIsleriLuzumMuzekkeresiOnayEkiSchema =
  LuzumMuzekkeresiOnayEkiSchema;
export type YapimIsleriLuzumMuzekkeresiOnayEkiType = z.infer<
  typeof YapimIsleriLuzumMuzekkeresiOnayEkiSchema
>;
