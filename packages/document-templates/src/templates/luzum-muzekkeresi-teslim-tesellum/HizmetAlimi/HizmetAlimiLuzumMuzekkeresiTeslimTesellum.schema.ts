import { z } from "zod";
import { LuzumMuzekkeresiTeslimTesellumSchema } from "../LuzumMuzekkeresiTeslimTesellum.schema";

export const HizmetAlimiLuzumMuzekkeresiTeslimTesellumSchema =
  LuzumMuzekkeresiTeslimTesellumSchema;

export type HizmetAlimiLuzumMuzekkeresiTeslimTesellumType = z.infer<
  typeof HizmetAlimiLuzumMuzekkeresiTeslimTesellumSchema
>;
