import type { FormFieldType } from "./types.js";

export interface FieldDefinition {
  type: FormFieldType;
  valueType: "string" | "number" | "boolean";
  supportsOptions: boolean;
}

export const fieldRegistry: Record<FormFieldType, FieldDefinition> = {
  text: { type: "text", valueType: "string", supportsOptions: false },
  number: { type: "number", valueType: "number", supportsOptions: false },
  date: { type: "date", valueType: "string", supportsOptions: false },
  select: { type: "select", valueType: "string", supportsOptions: true },
  checkbox: { type: "checkbox", valueType: "boolean", supportsOptions: false }
};
