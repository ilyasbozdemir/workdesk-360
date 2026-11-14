import { z } from "zod";
import { LuzumMuzekkeresiTeslimTesellumSchema } from "../LuzumMuzekkeresiTeslimTesellum.schema";

export const DanismanlikLuzumMuzekkeresiTeslimTesellumSchema =
  LuzumMuzekkeresiTeslimTesellumSchema;

export type DanismanlikLuzumMuzekkeresiTeslimTesellumType = z.infer<
  typeof DanismanlikLuzumMuzekkeresiTeslimTesellumSchema
>;
