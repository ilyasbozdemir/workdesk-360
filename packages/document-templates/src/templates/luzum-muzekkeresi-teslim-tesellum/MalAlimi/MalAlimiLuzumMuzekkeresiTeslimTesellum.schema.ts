import { z } from "zod";
import { LuzumMuzekkeresiTeslimTesellumSchema } from "../LuzumMuzekkeresiTeslimTesellum.schema";

export const MalAlimiLuzumMuzekkeresiTeslimTesellumSchema =
  LuzumMuzekkeresiTeslimTesellumSchema;

export type MalAlimiLuzumMuzekkeresiTeslimTesellumType = z.infer<
  typeof MalAlimiLuzumMuzekkeresiTeslimTesellumSchema
>;
