import type { FormDefinition } from "./types.js";
import { fieldRegistry } from "./field-registry.js";

/**
 * Framework-neutral renderer model.
 * React UI can map this output to input components.
 */
export function renderFormModel(definition: FormDefinition) {
  return {
    title: definition.title,
    description: definition.description,
    fields: definition.fields.map((field) => {
      if (!fieldRegistry[field.type]) throw new Error(`Unknown field type: ${field.type}`);
      return {
        ...field,
        control: `FormField:${field.type}`,
        required: Boolean(field.required)
      };
    })
  };
}
