export type FormFieldType = "text" | "number" | "date" | "select" | "checkbox";

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface FormDefinition {
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  fields: FormFieldDefinition[];
}
