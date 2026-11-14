import { z } from "zod";
import { LuzumMuzekkeresiOnayEkiSchema } from "../LuzumMuzekkeresiOnayEki.schema";

export const MalAlimiLuzumMuzekkeresiOnayEkiSchema = LuzumMuzekkeresiOnayEkiSchema;
export type MalAlimiLuzumMuzekkeresiOnayEkiType = z.infer<
  typeof MalAlimiLuzumMuzekkeresiOnayEkiSchema
>;
