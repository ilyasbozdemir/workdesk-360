import { z } from "zod";
import { LuzumMuzekkeresiTeslimTesellumSchema } from "../LuzumMuzekkeresiTeslimTesellum.schema";

export const YapimIsleriLuzumMuzekkeresiTeslimTesellumSchema =
  LuzumMuzekkeresiTeslimTesellumSchema;

export type YapimIsleriLuzumMuzekkeresiTeslimTesellumType = z.infer<
  typeof YapimIsleriLuzumMuzekkeresiTeslimTesellumSchema
>;
