import { z } from "zod";
import { LuzumMuzekkeresiOnayEkiSchema } from "../LuzumMuzekkeresiOnayEki.schema";

export const HizmetAlimiLuzumMuzekkeresiOnayEkiSchema =
  LuzumMuzekkeresiOnayEkiSchema;
export type HizmetAlimiLuzumMuzekkeresiOnayEkiType = z.infer<
  typeof HizmetAlimiLuzumMuzekkeresiOnayEkiSchema
>;
