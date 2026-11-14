import { z } from "zod";
import { LuzumMuzekkeresiOnayEkiSchema } from "../LuzumMuzekkeresiOnayEki.schema";

export const DanismanlikLuzumMuzekkeresiOnayEkiSchema =
  LuzumMuzekkeresiOnayEkiSchema;
export type DanismanlikLuzumMuzekkeresiOnayEkiType = z.infer<
  typeof DanismanlikLuzumMuzekkeresiOnayEkiSchema
>;
